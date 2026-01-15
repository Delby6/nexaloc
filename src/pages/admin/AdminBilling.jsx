// src/pages/admin/AdminBilling.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Loader2,
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  User2,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Edit3,
  DollarSign,
} from "lucide-react";

import { API_BASE } from "@/lib/apiBase";

const MONTHLY_PRICE_ID =
  import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ||
  (typeof process !== "undefined"
    ? process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
    : "");

const YEARLY_PRICE_ID =
  import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID ||
  (typeof process !== "undefined"
    ? process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
    : "");

// Helper: simple CSV download
function downloadCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val == null) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv =
    headers.join(",") +
    "\n" +
    rows.map((row) => headers.map((h) => escape(row[h])).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBilling() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [subsLoading, setSubsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedSub, setSelectedSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit subscription modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInterval, setEditInterval] = useState("month");
  const [editCoupon, setEditCoupon] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Refund invoice
  const [refundingInvoiceId, setRefundingInvoiceId] = useState(null);

  const stripePricesConfigured = Boolean(MONTHLY_PRICE_ID || YEARLY_PRICE_ID);

  /* -------------------------------------------------------
     Auth + Admin Check
  ------------------------------------------------------- */
  useEffect(() => {
    async function init() {
      try {
        setAuthLoading(true);
        setError("");

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
          setError("Please log in as an admin.");
          navigate("/owner-login");
          return;
        }

        setCurrentUser(user);

        // Check admin via admin_users table
        const { data: adminRow, error: adminErr } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminErr) {
          console.error("Admin check error:", adminErr);
          setError("Failed to verify admin permissions.");
          setIsAdmin(false);
          return;
        }

        const isAdminUser = !!adminRow;
        setIsAdmin(isAdminUser);

        if (!isAdminUser) {
          setError("You are not authorized to access the admin billing panel.");
          return;
        }

        await fetchSubscriptions(user.id);
      } catch (err) {
        console.error("AdminBilling init error:", err);
        setError(err.message || "Failed to load admin billing.");
      } finally {
        setAuthLoading(false);
      }
    }

    init();
  }, [navigate]);

  /* -------------------------------------------------------
     Fetch subscriptions (admin)
  ------------------------------------------------------- */
  async function fetchSubscriptions(adminUserId) {
    try {
      setSubsLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/admin/billing/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load subscriptions.");
      }

      setSubscriptions(json.subscriptions || []);
    } catch (err) {
      console.error("Admin fetch subscriptions error:", err);
      setError(err.message || "Failed to load subscriptions.");
    } finally {
      setSubsLoading(false);
    }
  }

  /* -------------------------------------------------------
     Fetch invoices for selected user
  ------------------------------------------------------- */
  async function fetchInvoicesForUser(userId) {
    if (!currentUser) return;
    try {
      setInvoicesLoading(true);
      setError("");
      setInvoices([]);

      const res = await fetch(`${API_BASE}/api/admin/billing/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          userId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load invoices.");
      }

      setInvoices(json.invoices || []);
    } catch (err) {
      console.error("Admin fetch invoices error:", err);
      setError(err.message || "Failed to load invoices.");
    } finally {
      setInvoicesLoading(false);
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

  const statusCounts = useMemo(() => {
    const counts = {
      total: subscriptions.length,
      active: 0,
      trialing: 0,
      canceled: 0,
      past_due: 0,
    };
    subscriptions.forEach((s) => {
      const st = s.status;
      if (!st) return;
      if (st === "active") counts.active += 1;
      if (st === "trialing") counts.trialing += 1;
      if (st === "canceled") counts.canceled += 1;
      if (st === "past_due") counts.past_due += 1;
    });
    return counts;
  }, [subscriptions]);

  const analytics = useMemo(() => {
    const { total, active, trialing, canceled, past_due } = statusCounts;
    const paying = active;
    const trials = trialing;
    const canceledTotal = canceled + past_due;

    const trialConversionRate =
      trials + paying === 0 ? 0 : Math.round((paying / (trials + paying)) * 100);

    const churnRate =
      paying + canceledTotal === 0
        ? 0
        : Math.round((canceledTotal / (paying + canceledTotal)) * 100);

    return {
      paying,
      trials,
      trialConversionRate,
      churnRate,
    };
  }, [statusCounts]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (sub.user_id && sub.user_id.toLowerCase().includes(term)) ||
        (sub.stripe_customer_id &&
          sub.stripe_customer_id.toLowerCase().includes(term)) ||
        (sub.stripe_subscription_id &&
          sub.stripe_subscription_id.toLowerCase().includes(term)) ||
        (sub.plan && sub.plan.toLowerCase().includes(term))
      );
    });
  }, [subscriptions, searchTerm, statusFilter]);

  /* -------------------------------------------------------
     Edit Subscription Modal logic
  ------------------------------------------------------- */
  function openEditModal(sub) {
    setSelectedSub(sub);
    setEditInterval("month");
    setEditCoupon("");
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditCoupon("");
  }

  async function handleSaveSubscriptionEdit() {
    if (!currentUser || !selectedSub) return;

    try {
      setEditSaving(true);
      setError("");

      if (!stripePricesConfigured) {
        throw new Error(
          "Stripe price IDs are not configured. Set VITE_STRIPE_PRO_MONTHLY_PRICE_ID / YEARLY in your .env."
        );
      }

      let priceId = null;
      if (editInterval === "year") {
        if (!YEARLY_PRICE_ID) {
          throw new Error("Yearly price ID is not configured.");
        }
        priceId = YEARLY_PRICE_ID;
      } else {
        if (!MONTHLY_PRICE_ID) {
          throw new Error("Monthly price ID is not configured.");
        }
        priceId = MONTHLY_PRICE_ID;
      }

      // 1) Change plan via existing billing endpoint
      const resPlan = await fetch(`${API_BASE}/api/billing/change-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedSub.user_id,
          priceId,
          planCode: selectedSub.plan || "pro",
        }),
      });

      const jsonPlan = await resPlan.json();
      if (!resPlan.ok || !jsonPlan.ok) {
        throw new Error(jsonPlan.error || "Failed to change subscription plan.");
      }

      // 2) Optional coupon
      if (editCoupon.trim()) {
        const resCoupon = await fetch(`${API_BASE}/api/billing/apply-coupon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedSub.user_id,
            coupon: editCoupon.trim(),
          }),
        });

        const jsonCoupon = await resCoupon.json();
        if (!resCoupon.ok || !jsonCoupon.ok) {
          throw new Error(jsonCoupon.error || "Failed to apply coupon.");
        }
      }

      // Refresh data
      await fetchSubscriptions(currentUser.id);
      await fetchInvoicesForUser(selectedSub.user_id);

      closeEditModal();
    } catch (err) {
      console.error("Admin edit subscription error:", err);
      setError(err.message || "Failed to update subscription.");
    } finally {
      setEditSaving(false);
    }
  }

  /* -------------------------------------------------------
     Refund Invoice (skeleton – requires server route)
  ------------------------------------------------------- */
  async function handleRefundInvoice(invoiceId) {
    if (!currentUser || !invoiceId) return;
    try {
      setRefundingInvoiceId(invoiceId);
      setError("");

      // This expects a backend route:
      // POST /api/admin/billing/refund-invoice
      // body: { adminUserId, invoiceId }
      const res = await fetch(
        `${API_BASE}/api/admin/billing/refund-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId: currentUser.id,
            invoiceId,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to refund invoice.");
      }

      // On success, reload invoices for current user
      if (selectedSub) {
        await fetchInvoicesForUser(selectedSub.user_id);
      }
    } catch (err) {
      console.error("Admin refund invoice error:", err);
      setError(
        err.message ||
          "Failed to refund invoice. Ensure backend endpoint is implemented."
      );
    } finally {
      setRefundingInvoiceId(null);
    }
  }

  /* -------------------------------------------------------
     CSV Exports
  ------------------------------------------------------- */
  function handleExportSubscriptionsCsv() {
    if (!subscriptions.length) return;
    const rows = subscriptions.map((s) => ({
      id: s.id,
      user_id: s.user_id,
      plan: s.plan,
      status: s.status,
      stripe_customer_id: s.stripe_customer_id,
      stripe_subscription_id: s.stripe_subscription_id,
      trial_end: s.trial_end,
      cancel_at: s.cancel_at,
      renew_at: s.renew_at,
      created_at: s.created_at,
    }));
    downloadCsv("subscriptions.csv", rows);
  }

  function handleExportInvoicesCsv() {
    if (!invoices.length) return;
    const rows = invoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      currency: inv.currency,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : "",
      hosted_invoice_url: inv.hosted_invoice_url,
      customer_email: inv.customer_email || "",
    }));
    downloadCsv("invoices.csv", rows);
  }

  /* -------------------------------------------------------
     Loading / no-admin states
  ------------------------------------------------------- */
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading admin billing…
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-3xl space-y-6">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin Billing
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You don&apos;t have permission to view this page.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Back to admin dashboard
            </button>
          </header>

          {error && (
            <div className="rounded-lg border border-red-400/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  /* -------------------------------------------------------
     Main admin billing UI
  ------------------------------------------------------- */
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Payment Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                View and monitor all customer subscriptions and invoices.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportSubscriptionsCsv}
              disabled={!subscriptions.length}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3 w-3" />
              Export subs CSV
            </button>
            <button
              onClick={handleExportInvoicesCsv}
              disabled={!invoices.length}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3 w-3" />
              Export invoices CSV
            </button>

            <button
              onClick={() => currentUser && fetchSubscriptions(currentUser.id)}
              disabled={subsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-4 w-4 ${subsLoading ? "animate-spin" : ""}`}
              />
              {subsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-400/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Analytics strip */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Subscriptions"
            value={statusCounts.total}
            hint="All records in billing_subscriptions."
          />
          <KpiCard
            label="Active"
            value={statusCounts.active}
            hint="Currently active subscribers."
            tone="success"
          />
          <KpiCard
            label="Trialing"
            value={statusCounts.trialing}
            hint="On free or trial plans."
          />
          <KpiCard
            label="Canceled / Past Due"
            value={statusCounts.canceled + statusCounts.past_due}
            hint="Canceled or payment issues."
            tone="warning"
          />
        </section>

        {/* Secondary analytics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Paying customers"
            value={analytics.paying}
            hint="Number of active paying subscribers."
          />
          <KpiCard
            label="Trials"
            value={analytics.trials}
            hint="Currently trialing subscriptions."
          />
          <KpiCard
            label="Trial conversion"
            value={`${analytics.trialConversionRate}%`}
            hint="Paying / (trials + paying)."
          />
          <KpiCard
            label="Churn (rough)"
            value={`${analytics.churnRate}%`}
            hint="Canceled & past due vs total."
          />
          {!stripePricesConfigured && (
            <KpiCard
              label="Stripe prices"
              value="Not configured"
              hint="Set VITE_STRIPE_PRO_MONTHLY_PRICE_ID / YEARLY to enable plan editing."
              tone="warning"
            />
          )}
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user ID, Stripe customer, subscription, or plan…"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </section>

        {/* Subscriptions table + invoices panel */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
          {/* Subscriptions table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Subscriptions
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredSubscriptions.length} of {subscriptions.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-slate-700 dark:text-slate-200">
                <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Trial end</th>
                    <th className="py-2 pr-3">Next renew</th>
                    <th className="py-2 pr-3">Stripe sub</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subsLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-slate-500 dark:text-slate-400"
                      >
                        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                        Loading subscriptions…
                      </td>
                    </tr>
                  ) : filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-slate-500 dark:text-slate-400"
                      >
                        No subscriptions match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="py-2 pr-3 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              <User2 className="h-3 w-3" />
                            </div>
                            <div className="max-w-[180px]">
                              <p className="truncate font-medium">
                                {sub.user_id}
                              </p>
                              {sub.stripe_customer_id && (
                                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                  Cust: {sub.stripe_customer_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-3 align-top">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {sub.plan || "N/A"}
                          </span>
                        </td>
                        <td className="py-2 pr-3 align-top">
                          <StatusPill status={sub.status} />
                        </td>
                        <td className="py-2 pr-3 align-top text-[11px] text-slate-600 dark:text-slate-300">
                          {sub.trial_end ? formatDate(sub.trial_end) : "—"}
                        </td>
                        <td className="py-2 pr-3 align-top text-[11px] text-slate-600 dark:text-slate-300">
                          {sub.renew_at ? formatDate(sub.renew_at) : "—"}
                        </td>
                        <td className="py-2 pr-3 align-top max-w-[160px]">
                          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {sub.stripe_subscription_id || "—"}
                          </p>
                        </td>
                        <td className="py-2 pr-0 align-top text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSub(sub);
                              fetchInvoicesForUser(sub.user_id);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-3 w-3" />
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices / details panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Invoices / Details
                </h2>
              </div>
            </div>

            {!selectedSub ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select a subscription to see invoices and additional details.
              </p>
            ) : (
              <>
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold">
                      User:{" "}
                      <span className="font-mono text-[11px]">
                        {selectedSub.user_id}
                      </span>
                    </span>
                    <StatusPill status={selectedSub.status} />
                  </div>
                  <p className="text-[11px]">
                    Plan:{" "}
                    <span className="font-mono">
                      {selectedSub.plan || "N/A"}
                    </span>
                  </p>
                  {selectedSub.stripe_subscription_id && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Stripe sub:{" "}
                      <span className="font-mono">
                        {selectedSub.stripe_subscription_id}
                      </span>
                    </p>
                  )}
                  {selectedSub.trial_end && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Trial ends: {formatDateTime(selectedSub.trial_end)}
                    </p>
                  )}
                  {selectedSub.cancel_at && (
                    <p className="mt-1 text-[11px] text-red-500 dark:text-red-300">
                      Cancel at: {formatDateTime(selectedSub.cancel_at)}
                    </p>
                  )}
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Recent invoices
                  </span>
                  {invoicesLoading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </span>
                  )}
                </div>

                {invoices.length === 0 && !invoicesLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No invoices found for this user.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {formatAmount(
                              inv.amount_paid || inv.amount_due,
                              inv.currency
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {inv.created
                              ? formatDateTime(inv.created * 1000)
                              : "—"}
                          </p>
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-[11px] text-sky-600 hover:underline dark:text-sky-400"
                            >
                              View invoice
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusPill status={inv.status} small />
                          {inv.paid && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={!!refundingInvoiceId}
                            onClick={() => handleRefundInvoice(inv.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-400/70 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/60 dark:text-red-300 dark:hover:bg-red-900/30"
                          >
                            {refundingInvoiceId === inv.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <DollarSign className="h-3 w-3" />
                            )}
                            Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Edit Subscription Modal */}
        {isEditModalOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Edit Subscription
                  </h2>
                </div>
                <button
                  onClick={closeEditModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              {!stripePricesConfigured && (
                <div className="mb-3 rounded-md border border-amber-400/60 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-200">
                  Stripe price IDs are not configured. Set{" "}
                  <span className="font-mono">
                    VITE_STRIPE_PRO_MONTHLY_PRICE_ID
                  </span>{" "}
                  and{" "}
                  <span className="font-mono">
                    VITE_STRIPE_PRO_YEARLY_PRICE_ID
                  </span>{" "}
                  in your .env file to enable plan changes.
                </div>
              )}

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    User
                  </p>
                  <p className="font-mono text-[11px]">{selectedSub.user_id}</p>
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Plan interval
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditInterval("month")}
                      className={
                        "flex-1 rounded-full border px-3 py-1.5 text-xs " +
                        (editInterval === "month"
                          ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-100"
                          : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")
                      }
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditInterval("year")}
                      className={
                        "flex-1 rounded-full border px-3 py-1.5 text-xs " +
                        (editInterval === "year"
                          ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-100"
                          : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")
                      }
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Coupon code (optional)
                  </p>
                  <input
                    type="text"
                    value={editCoupon}
                    onChange={(e) => setEditCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={closeEditModal}
                  disabled={editSaving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubscriptionEdit}
                  disabled={editSaving || !stripePricesConfigured}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-sky-700 disabled:opacity-60"
                >
                  {editSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* -------------------------------------------------------
   Small components
------------------------------------------------------- */

function KpiCard({ label, value, hint, tone = "default" }) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-400/60 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/20"
      : tone === "warning"
      ? "border-amber-400/60 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/20"
      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status, small = false }) {
  if (!status) return null;
  const st = status.toLowerCase();

  let bg =
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100";
  let icon = null;

  if (st === "active" || st === "paid") {
    bg =
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    icon = <CheckCircle2 className="h-3 w-3" />;
  } else if (st === "trialing") {
    bg = "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200";
  } else if (
    st === "past_due" ||
    st === "canceled" ||
    st === "uncollectible"
  ) {
    bg = "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-200";
    icon = <AlertTriangle className="h-3 w-3" />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 ${
        small ? "py-0.5 text-[10px]" : "py-1 text-[11px]"
      } font-medium capitalize ${bg}`}
    >
      {icon}
      {st.replace("_", " ")}
    </span>
  );
}
