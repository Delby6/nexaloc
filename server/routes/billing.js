// server/routes/billing.js
import express from "express";
import Stripe from "stripe";
import cors from "cors";
import { supabase } from "../supabaseClient.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

/* -------------------------------------------------------
   CORS
------------------------------------------------------- */
router.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

/* Small helper */
function handleStripeError(res, context, err) {
  console.error(`❌ ${context}: FULL ERROR ↓↓↓`);
  console.error(err);
  return res.status(500).json({ error: "Internal billing error" });
}

/* -------------------------------------------------------
   CREATE CHECKOUT SESSION (14-day trial)
------------------------------------------------------- */
router.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("🔥 CREATE CHECKOUT SESSION");

    const {
      priceId,
      mode = "subscription",
      successUrl,
      cancelUrl,
      userId,
      email,
    } = req.body || {};

    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!priceId)
      return res.status(400).json({ error: "Missing Stripe priceId" });

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],

      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: userId,
          plan_code: "pro",
        },
      },

      metadata: {
        user_id: userId,
        plan_code: "pro",
      },

      success_url:
        successUrl || `${allowedOrigin}/owner/billing?status=success`,
      cancel_url: cancelUrl || `${allowedOrigin}/owner/billing?status=cancel`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    return handleStripeError(res, "Stripe Error (create-checkout-session)", err);
  }
});

/* -------------------------------------------------------
   CUSTOMER PORTAL SESSION (fallback / advanced actions)
------------------------------------------------------- */
router.post("/create-portal-session", async (req, res) => {
  try {
    const { userId, returnUrl } = req.body || {};

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (portal lookup):", error);
      return res.status(500).json({ error: "Failed to fetch customer" });
    }

    if (!row?.stripe_customer_id) {
      return res.status(400).json({ error: "No customer found" });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: returnUrl || `${allowedOrigin}/owner/billing`,
    });

    return res.json({ url: portal.url });
  } catch (err) {
    return handleStripeError(res, "Stripe Portal Error", err);
  }
});

/* -------------------------------------------------------
   BASIC: DIRECT STRIPE SUBSCRIPTION STATUS LOOKUP
   (kept for lightweight checks)
------------------------------------------------------- */
router.post("/get-subscription-status", async (req, res) => {
  try {
    const { userId } = req.body || {};

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (status lookup):", error);
      return res.json({ ok: false, subscription: null });
    }

    if (!row?.stripe_subscription_id) {
      return res.json({ ok: false, subscription: null });
    }

    const sub = await stripe.subscriptions.retrieve(
      row.stripe_subscription_id,
      { expand: ["latest_invoice", "items.data.price"] }
    );

    return res.json({
      ok: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        trial_end: sub.trial_end ? sub.trial_end * 1000 : null,
        cancel_at: sub.cancel_at ? sub.cancel_at * 1000 : null,
        current_period_start: sub.current_period_start * 1000,
        current_period_end: sub.current_period_end * 1000,
        amount: sub.items.data[0].price.unit_amount,
        interval: sub.items.data[0].price.recurring.interval,
        currency: sub.items.data[0].price.currency,
      },
    });
  } catch (err) {
    console.error("❌ Stripe Lookup Error:", err);
    return res.json({ ok: false, subscription: null });
  }
});

/* -------------------------------------------------------
   ADVANCED DASHBOARD: PAYMENT METHOD, INVOICES, ETC.
------------------------------------------------------- */
router.post("/dashboard", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: subRow, error } = await supabase
      .from("billing_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (dashboard):", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!subRow) {
      return res.json({
        ok: true,
        subscription: null,
        stripeSubscription: null,
        paymentMethod: null,
        upcomingInvoice: null,
        invoices: [],
      });
    }

    const { stripe_customer_id, stripe_subscription_id } = subRow;

    let paymentMethod = null;
    let upcomingInvoice = null;
    let invoices = [];
    let stripeSummary = null;

    if (stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(
          stripe_subscription_id,
          { expand: ["items.data.price"] }
        );

        stripeSummary = {
          id: sub.id,
          status: sub.status,
          trial_end: sub.trial_end ? sub.trial_end * 1000 : null,
          cancel_at: sub.cancel_at ? sub.cancel_at * 1000 : null,
          current_period_start: sub.current_period_start * 1000,
          current_period_end: sub.current_period_end * 1000,
          amount: sub.items.data[0].price.unit_amount,
          interval: sub.items.data[0].price.recurring.interval,
          currency: sub.items.data[0].price.currency,
        };
      } catch (err) {
        console.error("Stripe error (dashboard subscription):", err);
      }
    }

    if (stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(stripe_customer_id, {
          expand: ["invoice_settings.default_payment_method"],
        });

        const pm = customer.invoice_settings?.default_payment_method;
        if (pm && pm.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          };
        }
      } catch (err) {
        console.error("Stripe error (customer / payment method):", err);
      }

      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          customer: stripe_customer_id,
          subscription: stripe_subscription_id || undefined,
        });

        if (upcoming) {
          upcomingInvoice = {
            amount_due: upcoming.amount_due,
            currency: upcoming.currency,
            next_payment_attempt: upcoming.next_payment_attempt
              ? upcoming.next_payment_attempt * 1000
              : null,
            period_end:
              upcoming.lines?.data?.[0]?.period?.end &&
              upcoming.lines.data[0].period.end * 1000,
            has_discount:
              Array.isArray(upcoming.total_discount_amounts) &&
              upcoming.total_discount_amounts.length > 0,
          };
        }
      } catch (err) {
        // Often fails if no upcoming invoice; not fatal
        console.error("Stripe error (upcoming invoice):", err.message);
      }

      try {
        const invoiceList = await stripe.invoices.list({
          customer: stripe_customer_id,
          limit: 12,
        });

        invoices = invoiceList.data.map((inv) => ({
          id: inv.id,
          created: inv.created * 1000,
          amount_paid: inv.amount_paid,
          amount_due: inv.amount_due,
          currency: inv.currency,
          status: inv.status,
          hosted_invoice_url: inv.hosted_invoice_url,
          invoice_pdf: inv.invoice_pdf,
        }));
      } catch (err) {
        console.error("Stripe error (invoice history):", err);
      }
    }

    return res.json({
      ok: true,
      subscription: subRow,
      stripeSubscription: stripeSummary,
      paymentMethod,
      upcomingInvoice,
      invoices,
    });
  } catch (err) {
    return handleStripeError(res, "dashboard", err);
  }
});

/* -------------------------------------------------------
   CANCEL SUBSCRIPTION – cancel at period end
------------------------------------------------------- */
router.post("/cancel-subscription", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (cancel lookup):", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!row?.stripe_subscription_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const updatedSub = await stripe.subscriptions.update(
      row.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    const cancelAt =
      updatedSub.cancel_at || updatedSub.current_period_end || null;

    if (cancelAt) {
      const cancelDate = new Date(cancelAt * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("billing_subscriptions")
        .update({
          status: updatedSub.status,
          cancel_at: cancelDate,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Supabase error (cancel update):", updateError);
      }
    }

    return res.json({
      ok: true,
      status: updatedSub.status,
      cancel_at: cancelAt ? cancelAt * 1000 : null,
    });
  } catch (err) {
    return handleStripeError(res, "Stripe Error (cancel-subscription)", err);
  }
});

/* -------------------------------------------------------
   REACTIVATE – remove cancel_at
------------------------------------------------------- */
router.post("/reactivate-subscription", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (reactivate lookup):", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!row?.stripe_subscription_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const updatedSub = await stripe.subscriptions.update(
      row.stripe_subscription_id,
      { cancel_at_period_end: false }
    );

    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({
        status: updatedSub.status,
        cancel_at: null,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Supabase error (reactivate update):", updateError);
    }

    return res.json({
      ok: true,
      status: updatedSub.status,
      cancel_at: null,
    });
  } catch (err) {
    return handleStripeError(
      res,
      "Stripe Error (reactivate-subscription)",
      err
    );
  }
});

/* -------------------------------------------------------
   CHANGE PLAN – switch price (monthly/yearly)
------------------------------------------------------- */
router.post("/change-plan", async (req, res) => {
  try {
    const { userId, priceId, planCode } = req.body || {};

    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!priceId) return res.status(400).json({ error: "Missing priceId" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (change-plan lookup):", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!row?.stripe_subscription_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);

    if (!sub.items?.data?.length) {
      return res.status(400).json({ error: "Subscription has no items" });
    }

    const itemId = sub.items.data[0].id;

    const updatedSub = await stripe.subscriptions.update(
      row.stripe_subscription_id,
      {
        items: [
          {
            id: itemId,
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    const newPlan = planCode || row.plan || "pro";

    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({
        status: updatedSub.status,
        plan: newPlan,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Supabase error (change-plan update):", updateError);
    }

    return res.json({
      ok: true,
      status: updatedSub.status,
      plan: newPlan,
    });
  } catch (err) {
    return handleStripeError(res, "Stripe Error (change-plan)", err);
  }
});

/* -------------------------------------------------------
   APPLY COUPON – simple coupon by code
------------------------------------------------------- */
router.post("/apply-coupon", async (req, res) => {
  try {
    const { userId, coupon } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!coupon) return res.status(400).json({ error: "Missing coupon code" });

    const { data: row, error } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error (apply-coupon lookup):", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!row?.stripe_subscription_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    // ⚠️ FLEXIBLE BILLING SAFE DISCOUNT FORMAT
    const updated = await stripe.subscriptions.update(
      row.stripe_subscription_id,
      {
        discounts: [
          {
            coupon: coupon,
          },
        ],
      }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Stripe Error (apply-coupon):", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to apply coupon",
    });
  }
});

export default router;