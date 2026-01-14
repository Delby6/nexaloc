// server/middleware/requireProUser.js
import { supabase } from "../supabaseClient.js";

/**
 * Ensures the user has a PRO subscription (active or trialing).
 * Expects req.body.userId (same as your billing routes).
 */
export async function requireProUser(req, res, next) {
  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Missing userId" });
    }

    const { data: sub, error } = await supabase
      .from("billing_subscriptions")
      .select("status, plan, cancel_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("requireProUser Supabase error:", error);
      return res.status(500).json({ error: "Failed to verify subscription" });
    }

    // No subscription row at all
    if (!sub) {
      return res.status(403).json({
        error: "Upgrade required",
        message: "This feature is available for PRO users only.",
      });
    }

    // Allow trial and active PRO
    const allowed =
      (sub.status === "active" || sub.status === "trialing") &&
      sub.plan === "pro";

    if (!allowed) {
      return res.status(403).json({
        error: "Upgrade required",
        message: "This feature is available for PRO users only.",
      });
    }

    // Attach subscription details for downstream use
    req.subscription = sub;
    next();
  } catch (err) {
    console.error("requireProUser error:", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
}
