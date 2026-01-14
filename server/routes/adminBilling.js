// server/routes/adminBilling.js
import express from "express";
import Stripe from "stripe";
import { supabase } from "../supabaseClient.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use JSON for this router
router.use(express.json());

// Helper: verify admin via admin_users table
async function assertAdmin(adminUserId) {
  if (!adminUserId) {
    throw Object.assign(new Error("Missing adminUserId."), { status: 401 });
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", adminUserId)
    .maybeSingle();

  if (error) {
    console.error("Supabase admin check error:", error);
    throw Object.assign(new Error("Failed to verify admin."), { status: 500 });
  }

  if (!data) {
    throw Object.assign(new Error("Not authorized."), { status: 403 });
  }

  return true;
}

/* -------------------------------------------------------
   POST /api/admin/billing/subscriptions
   Body: { adminUserId }
   Returns: { ok, subscriptions: [...] }
------------------------------------------------------- */
router.post("/billing/subscriptions", async (req, res) => {
  try {
    const { adminUserId } = req.body;

    await assertAdmin(adminUserId);

    const { data, error } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        user_id,
        plan,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        trial_end,
        cancel_at,
        created_at,
        renew_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase subscriptions fetch error:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to load subscriptions." });
    }

    return res.json({
      ok: true,
      subscriptions: data || [],
    });
  } catch (err) {
    console.error("Admin billing/subscriptions error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ ok: false, error: err.message || "Admin error." });
  }
});

/* -------------------------------------------------------
   POST /api/admin/billing/invoices
   Body: { adminUserId, userId }
   Returns: { ok, invoices: [...] }
------------------------------------------------------- */
router.post("/billing/invoices", async (req, res) => {
  try {
    const { adminUserId, userId } = req.body;

    await assertAdmin(adminUserId);

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing userId in request body." });
    }

    // Find subscription row for this user
    const { data: sub, error: subError } = await supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      console.error("Supabase subscription lookup error:", subError);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to find subscription." });
    }

    if (!sub || !sub.stripe_customer_id) {
      return res.json({
        ok: true,
        invoices: [],
      });
    }

    const invoices = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      limit: 20,
    });

    return res.json({
      ok: true,
      invoices: invoices.data || [],
    });
  } catch (err) {
    console.error("Admin billing/invoices error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ ok: false, error: err.message || "Admin error." });
  }
});
/* -------------------------------------------------------
   POST /api/admin/billing/refund-invoice
   Refund invoice (admin only)
------------------------------------------------------- */
router.post("/billing/refund-invoice", async (req, res) => {
  try {
    const { adminUserId, invoiceId } = req.body;

    if (!adminUserId)
      return res.status(400).json({ ok: false, error: "Missing adminUserId." });

    if (!invoiceId)
      return res.status(400).json({ ok: false, error: "Missing invoiceId." });

    // --- 1. Admin validation ---
    await assertAdmin(adminUserId);

    // --- 2. Retrieve invoice ---
    let invoice;
    try {
      invoice = await stripe.invoices.retrieve(invoiceId);
    } catch (err) {
      console.error("Stripe invoice retrieve error:", err);
      return res.status(404).json({
        ok: false,
        error: "Invoice not found in Stripe.",
      });
    }

    if (!invoice.payment_intent) {
      return res.status(400).json({
        ok: false,
        error: "Invoice cannot be refunded (no payment_intent).",
      });
    }

    // --- 3. Refund the charge ---
    let refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: invoice.payment_intent,
        reason: "requested_by_customer",
      });
    } catch (err) {
      console.error("Stripe refund error:", err);
      return res.status(500).json({
        ok: false,
        error: err.message || "Refund failed.",
      });
    }

    res.json({
      ok: true,
      refundId: refund.id,
      status: refund.status,
    });

  } catch (err) {
    console.error("Admin refund-invoice error:", err);
    const status = err.status || 500;
    return res.status(status).json({
      ok: false,
      error: err.message || "Refund processing error.",
    });
  }
});

export default router;
