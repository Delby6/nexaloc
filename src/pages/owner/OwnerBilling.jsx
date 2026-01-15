// src/pages/owner/OwnerBilling.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PricingSelector from "@/components/PricingSelector";

import { API_BASE } from "@/lib/apiBase";

export default function OwnerBilling() {
  const [subscription, setSubscription] = useState(null); // Supabase row
  const [stripeSubscription, setStripeSubscription] = useState(null); // Stripe summary
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const [banner, setBanner] = useState(null);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");

  const [searchParams] = useSearchParams();

  /* -------------------------------------------------------
     Banner from redirect status
  ------------------------------------------------------- */
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setBanner({
        type: "success",
        message: "Your subscription was updated successfully.",
      });
    } else if (status === "cancel") {
      setBanner({
        type: "info",
        message: "Checkout was cancelled. No charges were made.",
      });
    }
  }, [searchParams]);

  /* -------------------------------------------------------
     Init: load user + dashboard
  ------------------------------------------------------- */
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    try {
      setLoading(true);
      setError("");

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userData.user;
      if (!user) {
        setError("You must be logged in to view billing.");
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      await loadDashboard(user.id);
    } catch (err) {
      console.error("Billing init error:", err);
      setError(err.message ?? "Failed to load billing.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(userId) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/billing/dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        console.error("Dashboard HTTP error:", await res.text());
        setError("Failed to load billing dashboard.");
        return;
      }

      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed to load billing dashboard.");
        return;
      }

      setSubscription(json.subscription || null);
      setStripeSubscription(json.stripeSubscription || null);
      setPaymentMethod(json.paymentMethod || null);
      setUpcomingInvoice(json.upcomingInvoice || null);
      setInvoices(json.invoices || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err.message ?? "Failed to load billing dashboard.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function formatAmount(cents, currency) {
    if (cents == null) return "—";
    const cur = currency ? currency.toUpperCase() : "";
    return `${(cents / 100).toFixed(2)} ${cur}`;
  }

  function daysLeft(value) {
    if (!value) return null;
    const target = new Date(value).getTime();
    const diff = target - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const isTrial =
    subscription?.status === "trialing" ||
    stripeSubscription?.status === "trialing";

  const trialEnd =
    stripeSubscription?.trial_end || subscription?.trial_end || null;

  const trialDaysLeft = trialEnd ? daysLeft(trialEnd) : null;

  const trialExpired =
    isTrial && trialEnd && new Date(trialEnd) < new Date();

  const isProActive =
    (subscription &&
      subscription.plan === "pro" &&
      (subscription.status === "active" ||
        subscription.status === "trialing")) ||
    (stripeSubscription &&
      (stripeSubscription.status === "active" ||
        stripeSubscription.status === "trialing"));

  const canCancel =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    !subscription.cancel_at;

  const canReactivate =
    subscription &&
    subscription.status === "active" &&
    !!subscription.cancel_at;

  const nextRenewal =
    stripeSubscription?.current_period_end || subscription?.renew_at || null;

  const intervalLabel = stripeSubscription?.interval
    ? stripeSubscription.interval === "month"
      ? "Monthly"
      : stripeSubscription.interval === "year"
      ? "Yearly"
      : stripeSubscription.interval
    : null;

  const monthlyPriceId =
    import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ||
    (typeof process !== "undefined"
      ? process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
      : null);

  const yearlyPriceId =
    import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID ||
    (typeof process !== "undefined"
      ? process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
      : null);

  /* -------------------------------------------------------
     Stripe Checkout (Upgrade / Start trial)
  ------------------------------------------------------- */
  async function handleUpgrade() {
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      setCheckoutLoading(true);
      setError("");

      const priceId =
        monthlyPriceId || "price_1Sc57oGrRw2c7IAmNEVKteiZ"; // fallback

      const successUrl = `${window.location.origin}/owner/billing?status=success`;
      const cancelUrl = `${window.location.origin}/owner/billing?status=cancel`;

      const res = await fetch(
        `${API_BASE}/api/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            mode: "subscription",
            successUrl,
            cancelUrl,
            userId: currentUser.id,
            email: currentUser.email,
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (!data.url) throw new Error("No checkout URL returned.");

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message ?? "Failed to start checkout.");
      setCheckoutLoading(false);
    }
  }

  /* -------------------------------------------------------
     Stripe Customer Portal (fallback / full Stripe)
  ------------------------------------------------------- */
  async function handleOpenPortal() {
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      setPortalLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/billing/create-portal-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            returnUrl: `${window.location.origin}/owner/billing`,
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (!data.url) throw new Error("No portal URL returned.");

      window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
      setError(err.message ?? "Failed to open customer portal.");
      setPortalLoading(false);
    }
  }

  /* -------------------------------------------------------
     Change plan (monthly / yearly) via priceId
  ------------------------------------------------------- */
  async function handleChangePlan(priceId) {
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      if (!priceId) {
        throw new Error("No price selected.");
      }

      setChangePlanLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/billing/change-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          priceId,
          planCode: "pro",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to change plan.");
      }

      setBanner({
        type: "success",
        message: "Your plan has been updated.",
      });
      await loadDashboard(currentUser.id);
    } catch (err) {
      console.error("Change plan error:", err);
      setError(err.message ?? "Failed to change plan.");
    } finally {
      setChangePlanLoading(false);
    }
  }

  /* -------------------------------------------------------
     Apply coupon
  ------------------------------------------------------- */
  async function handleApplyCoupon() {
    if (!coupon.trim()) return;
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      setCouponLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/billing/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          coupon: coupon.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to apply coupon.");
      }

      setBanner({
        type: "success",
        message: "Coupon applied successfully.",
      });
      setCoupon("");
      await loadDashboard(currentUser.id);
    } catch (err) {
      console.error("Apply coupon error:", err);
      setError(err.message ?? "Failed to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  /* -------------------------------------------------------
     Cancel subscription (at period end)
  ------------------------------------------------------- */
  async function handleCancelSubscription() {
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      setCancelLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/billing/cancel-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      await loadDashboard(currentUser.id);
      setBanner({
        type: "info",
        message: "Your subscription will end at the end of the period.",
      });
    } catch (err) {
      console.error("Cancel subscription error:", err);
      setError(err.message ?? "Failed to cancel subscription.");
    } finally {
      setCancelLoading(false);
    }
  }

  /* -------------------------------------------------------
     Reactivate subscription
  ------------------------------------------------------- */
  async function handleReactivateSubscription() {
    try {
      if (!currentUser) {
        setError("You must be logged in.");
        return;
      }

      setReactivateLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/billing/reactivate-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to reactivate subscription.");
      }

      await loadDashboard(currentUser.id);
      setBanner({
        type: "success",
        message: "Your subscription has been reactivated.",
      });
    } catch (err) {
      console.error("Reactivate subscription error:", err);
      setError(err.message ?? "Failed to reactivate subscription.");
    } finally {
      setReactivateLoading(false);
    }
  }

  /* -------------------------------------------------------
     UI: Loading
  ------------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex justify-center items-center h-40 text-slate-500 dark:text-slate-400">
          <Loader2 className="animate-spin w-6 h-6" />
          <span className="ml-2 text-sm">Loading billing dashboard…</span>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Billing & Subscription
      </h1>

      {/* Banner */}
      {banner && (
        <div
          className={
            "mb-2 rounded-md px-4 py-3 text-sm border backdrop-blur " +
            (banner.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/60 dark:text-emerald-200"
              : "bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-500/15 dark:border-sky-500/60 dark:text-sky-200")
          }
        >
          {banner.message}
        </div>
      )}

      {error && (
        <div className="mb-2 rounded-md px-4 py-3 text-sm border bg-red-50 border-red-300 text-red-800 dark:bg-red-500/15 dark:border-red-500 dark:text-red-200 backdrop-blur">
          {error}
        </div>
      )}

      {/* -------------------------------------------------------
         NO SUBSCRIPTION → Trial CTA
      ------------------------------------------------------- */}
      {!subscription && (
        <div className="rounded-xl p-5 space-y-3 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
          <h2 className="text-lg font-semibold">Start your 14-day PRO Trial</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Unlock advanced AI tools, analytics, and premium features.
          </p>

          <button
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="w-full px-4 py-2 rounded-md bg-amber-400 text-black font-semibold hover:bg-amber-300 transition disabled:opacity-60"
          >
            {checkoutLoading ? "Redirecting…" : "Start FREE Trial"}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Card required • 14 days free • Cancel anytime
          </p>
        </div>
      )}

      {/* -------------------------------------------------------
         SUBSCRIPTION PRESENT → ADVANCED DASHBOARD
      ------------------------------------------------------- */}
      {subscription && (
        <div className="space-y-5">
          {/* PRICING SELECTOR (Monthly / Yearly toggle) */}
          <div className="rounded-xl p-4 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
            <PricingSelector
              currentInterval={stripeSubscription?.interval || "month"}
              monthlyPrice={24.99}
              yearlyPrice={199.99} // <-- set to your actual yearly amount
              yearlySavingsPercent={20}
              onSelectPlan={(interval) => {
                const priceId =
                  interval === "year"
                    ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
                    : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;

                handleChangePlan(priceId);
              }}
            />
          </div>

          {/* SUMMARY CARD */}
          <div className="rounded-xl p-5 space-y-4 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* LEFT */}
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  Current plan
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-amber-500 uppercase">
                    {subscription.plan}
                  </span>

                  {/* Status badge */}
                  <span
                    className={
                      "text-[10px] px-2 py-0.5 rounded-md font-bold capitalize " +
                      (subscription.status === "active"
                        ? "bg-emerald-500 text-black"
                        : subscription.status === "trialing"
                        ? "bg-blue-400 text-black"
                        : subscription.status === "canceled" ||
                          subscription.status === "unpaid" ||
                          subscription.status === "past_due"
                        ? "bg-red-500 text-black"
                        : "bg-slate-500 text-black")
                    }
                  >
                    {subscription.status}
                  </span>

                  {/* Trial badge */}
                  {isTrial && !trialExpired && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-400 text-black font-bold">
                      TRIAL
                    </span>
                  )}
                </div>

                {/* Interval & price from Stripe */}
                {stripeSubscription && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {intervalLabel && (
                      <>
                        {intervalLabel} •{" "}
                        {formatAmount(
                          stripeSubscription.amount,
                          stripeSubscription.currency
                        )}
                      </>
                    )}
                  </p>
                )}

                {/* Trial countdown */}
                {isTrial && trialDaysLeft != null && !trialExpired && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Trial ends in{" "}
                    <span className="font-semibold">{trialDaysLeft}</span> days (
                    {formatDate(trialEnd)})
                  </p>
                )}

                {/* Trial expired */}
                {trialExpired && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Your trial has ended. Subscribe to keep PRO features.
                  </p>
                )}

                {/* Cancellation scheduled */}
                {subscription.cancel_at && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Your plan will end on {formatDate(subscription.cancel_at)}.
                  </p>
                )}

                {/* Next renewal */}
                {nextRenewal && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Next renewal: {formatDate(nextRenewal)}
                  </p>
                )}
              </div>

              {/* RIGHT: ACTIONS */}
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                {/* Subscribe from trial */}
                {isTrial && !trialExpired && (
                  <button
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="px-3 py-2 rounded-md bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 transition disabled:opacity-60"
                  >
                    {checkoutLoading ? "Redirecting…" : "Subscribe now"}
                  </button>
                )}

                {/* Trial expired → force subscription */}
                {isTrial && trialExpired && (
                  <button
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="px-3 py-2 rounded-md bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition disabled:opacity-60"
                  >
                    {checkoutLoading ? "Redirecting…" : "Subscribe to PRO"}
                  </button>
                )}

                {/* Manage in Stripe */}
                {isProActive && !isTrial && (
                  <button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    className="px-3 py-2 rounded-md border border-slate-400 text-xs text-slate-800 hover:bg-slate-100 transition disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {portalLoading ? "Opening…" : "Open Stripe portal"}
                  </button>
                )}

                {/* Cancel */}
                {canCancel && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/70 text-xs text-red-700 hover:bg-red-500/20 transition disabled:opacity-60 dark:bg-red-500/20 dark:border-red-500/60 dark:text-red-200 dark:hover:bg-red-500/30"
                  >
                    {cancelLoading ? "Cancelling…" : "Cancel subscription"}
                  </button>
                )}

                {/* Reactivate */}
                {canReactivate && (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={reactivateLoading}
                    className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/70 text-xs text-emerald-700 hover:bg-emerald-500/20 transition disabled:opacity-60 dark:bg-emerald-500/20 dark:border-emerald-500/60 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                  >
                    {reactivateLoading ? "Reactivating…" : "Reactivate"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD + COUPON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment method */}
            <div className="rounded-xl p-4 space-y-3 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
              <h2 className="text-sm font-semibold">Payment method</h2>

              {paymentMethod ? (
                <div className="text-sm space-y-1">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Card:
                    </span>
                    <span className="font-medium uppercase">
                      {paymentMethod.brand} •••• {paymentMethod.last4}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Expires:
                    </span>
                    <span>
                      {String(paymentMethod.exp_month).padStart(2, "0")}/
                      {paymentMethod.exp_year}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No default payment method found.
                </p>
              )}

              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full mt-2 px-3 py-2 rounded-md bg-slate-900/5 text-xs text-slate-900 hover:bg-slate-900/10 transition disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                {portalLoading ? "Opening…" : "Update payment method"}
              </button>
            </div>

            {/* Coupon / discount */}
            <div className="rounded-xl p-4 space-y-3 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Discount code</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Apply a coupon if you were given one.
                  </p>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row gap-2 max-w-md">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 rounded-md bg-white/70 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !coupon.trim()}
                    className="px-3 py-2 rounded-md bg-emerald-500 text-xs text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-60"
                  >
                    {couponLoading ? "Applying…" : "Apply"}
                  </button>
                </div>
              </div>

              {upcomingInvoice?.has_discount && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Discount is active on your next invoice.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming invoice */}
          {upcomingInvoice && (
            <div className="rounded-xl p-4 space-y-2 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
              <h2 className="text-sm font-semibold">Next invoice</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Amount due:{" "}
                <span className="font-semibold">
                  {formatAmount(
                    upcomingInvoice.amount_due,
                    upcomingInvoice.currency
                  )}
                </span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Next charge:{" "}
                {formatDateTime(
                  upcomingInvoice.next_payment_attempt ||
                    upcomingInvoice.period_end
                )}
              </p>
            </div>
          )}

          {/* Payment history */}
          <div className="rounded-xl p-4 bg-white/60 border border-slate-300/40 text-slate-900 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Payment history</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing last {invoices.length} invoices
              </span>
            </div>

            {invoices.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No invoices found yet. Once you are charged, they will appear
                here.
              </p>
            )}

            {invoices.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left text-slate-800 dark:text-slate-300">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="py-2 pr-4">
                          {formatDate(inv.created)}
                        </td>
                        <td className="py-2 pr-4">
                          {formatAmount(
                            inv.amount_paid || inv.amount_due,
                            inv.currency
                          )}
                        </td>
                        <td className="py-2 pr-4 capitalize">
                          <span
                            className={
                              "px-2 py-0.5 rounded-full text-[10px] " +
                              (inv.status === "paid"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/30 dark:text-emerald-200"
                                : inv.status === "open" ||
                                  inv.status === "uncollectible"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-600/30 dark:text-amber-200"
                                : "bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-200")
                            }
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {inv.hosted_invoice_url ? (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-600 hover:text-amber-500 underline dark:text-amber-300 dark:hover:text-amber-200"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
