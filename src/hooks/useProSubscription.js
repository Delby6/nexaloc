// src/hooks/useProSubscription.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProSubscription() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchSubscription() {
      try {
        setLoading(true);
        setError("");

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userData.user;
        if (!user) {
          if (isMounted) {
            setSubscription(null);
            setIsPro(false);
          }
          return;
        }

        const { data: sub, error: subErr } = await supabase
          .from("billing_subscriptions")
          .select("status, plan, cancel_at, trial_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subErr) throw subErr;

        if (isMounted) {
          setSubscription(sub || null);
          const allowed =
            sub &&
            (sub.status === "active" || sub.status === "trialing") &&
            sub.plan === "pro";
          setIsPro(Boolean(allowed));
        }
      } catch (err) {
        console.error("useProSubscription error:", err);
        if (isMounted) {
          setError(err.message ?? "Failed to load subscription.");
          setSubscription(null);
          setIsPro(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, subscription, isPro, error };
}
