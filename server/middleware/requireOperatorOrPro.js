// server/middleware/requireOperatorOrPro.js
import { supabase } from "../supabaseClient.js";
import { requireProUser } from "./requireProUser.js";

/**
 * Allows:
 *  - admin_users (user_id)
 *  - operators (user_id)
 * Otherwise:
 *  - fallback to requireProUser (billing_subscriptions must be pro + active/trialing)
 *
 * NOTE: This keeps your current pattern: expects req.body.userId
 */
export async function requireOperatorOrPro(req, res, next) {
  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Missing userId" });
    }

    // ✅ Admin bypass
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminErr) {
      console.error("Admin check error:", adminErr);
      return res.status(500).json({ error: "Failed to verify admin role" });
    }

    if (adminRow) {
      req.isAdmin = true;
      return next();
    }

    // ✅ Operator bypass (your table is: public.operators with user_id)
    const { data: operatorRow, error: opErr } = await supabase
      .from("operators")
      .select("id, user_id, owner_id, email, full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (opErr) {
      console.error("Operator check error:", opErr);
      return res.status(500).json({ error: "Failed to verify operator role" });
    }

    if (operatorRow) {
      req.isOperator = true;
      req.operator = operatorRow;
      return next();
    }

    // Not admin/operator → keep your PRO gate unchanged
    return requireProUser(req, res, next);
  } catch (err) {
    console.error("requireOperatorOrPro error:", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
}
