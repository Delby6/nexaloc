// src/components/ClaimsContent.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import {
  Loader2,
  CheckCircle,
  X,
  Eye,
} from "lucide-react";

export default function ClaimsContent({
  claims,
  claimsLoading,
  fetchClaims,
  onBusinessesChanged,
}) {
  // ------- FILTER / SEARCH STATE -------
  const [claimFilter, setClaimFilter] = useState("all");
  const [claimSearch, setClaimSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkNotes, setBulkNotes] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClaim, setDrawerClaim] = useState(null);
  const [drawerNotes, setDrawerNotes] = useState("");

  // ------- FILTERED CLAIMS -------
  const filteredClaims = useMemo(() => {
    const t = claimSearch.trim().toLowerCase();

    return claims
      .filter((c) => (claimFilter === "all" ? true : c.status === claimFilter))
      .filter((c) => {
        if (!t) return true;
        const biz = (c.business?.name || "").toLowerCase();
        const email = (c.claimant?.email || "").toLowerCase();
        return biz.includes(t) || email.includes(t);
      });
  }, [claims, claimFilter, claimSearch]);

  const allFilteredIds = filteredClaims.map((c) => c.id);
  const allSelectedOnPage =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selected.has(id));

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // ------- DRAWER -------
  const openDrawer = (claim) => {
    setDrawerClaim(claim);
    setDrawerNotes(claim?.notes || "");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerClaim(null);
    setDrawerNotes("");
    setDrawerOpen(false);
  };

  // ------- APPROVE / REJECT LOGIC -------

  async function handleApprove(claim) {
    try {
      toast.loading("Approving claim...");

      // 1) Assign ownership on the business
      const { error: bizErr } = await supabase
        .from("businesses")
        .update({ owner_id: claim.claimant_id })
        .eq("id", claim.business_id);

      if (bizErr) throw bizErr;

      // 2) Mark this claim as approved
      const { error: claimErr } = await supabase
        .from("business_claims")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          notes: drawerNotes || null,
        })
        .eq("id", claim.id);

      if (claimErr) throw claimErr;

      // 3) Reject other pending claims for the same business
      const { error: rejectOthersErr } = await supabase
        .from("business_claims")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          notes:
            "Automatically rejected after another claim for this business was approved.",
        })
        .eq("business_id", claim.business_id)
        .neq("id", claim.id)
        .eq("status", "pending");

      if (rejectOthersErr) throw rejectOthersErr;

      toast.dismiss();
      toast.success("Claim approved");

      await fetchClaims();
      await onBusinessesChanged?.();

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(claim.id);
        return next;
      });

      closeDrawer();
    } catch (err) {
      console.error("Approve error:", err.message);
      toast.dismiss();
      toast.error("Failed to approve claim");
    }
  }

  async function handleReject(claim, notes) {
    try {
      toast.loading("Rejecting claim...");

      const { error } = await supabase
        .from("business_claims")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", claim.id);

      if (error) throw error;

      toast.dismiss();
      toast.success("Claim rejected");

      await fetchClaims();

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(claim.id);
        return next;
      });

      closeDrawer();
    } catch (err) {
      console.error("Reject error:", err.message);
      toast.dismiss();
      toast.error("Failed to reject claim");
    }
  }

  async function handleBulkApprove() {
    if (selected.size === 0) {
      toast("No claims selected");
      return;
    }

    try {
      toast.loading("Bulk approving claims...");

      const toProcess = claims.filter((c) => selected.has(c.id));
      const byBusiness = toProcess.reduce((acc, c) => {
        (acc[c.business_id] = acc[c.business_id] || []).push(c);
        return acc;
      }, {});

      // For each business, approve the first selected claim
      for (const bizId of Object.keys(byBusiness)) {
        const [first] = byBusiness[bizId];
        await handleApprove(first);
      }

      toast.dismiss();
      toast.success("Bulk approve complete");
      setSelected(new Set());
      await fetchClaims();
      await onBusinessesChanged?.();
    } catch (err) {
      console.error("Bulk approve error:", err.message);
      toast.dismiss();
      toast.error("Bulk approve failed");
    }
  }

  async function handleBulkReject() {
    if (selected.size === 0) {
      toast("No claims selected");
      return;
    }

    try {
      toast.loading("Bulk rejecting claims...");

      const ids = Array.from(selected);
      const { error } = await supabase
        .from("business_claims")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          notes: bulkNotes || null,
        })
        .in("id", ids);

      if (error) throw error;

      toast.dismiss();
      toast.success("Selected claims rejected");
      setSelected(new Set());
      setBulkNotes("");
      await fetchClaims();
    } catch (err) {
      console.error("Bulk reject error:", err.message);
      toast.dismiss();
      toast.error("Bulk reject failed");
    }
  }

  // ------- RENDER -------
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6"
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        Claims Review
      </h2>

      {/* Top Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by business or email"
          value={claimSearch}
          onChange={(e) => setClaimSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
        />

        <select
          value={claimFilter}
          onChange={(e) => setClaimFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={handleBulkApprove}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
        >
          <CheckCircle className="w-4 h-4" /> Approve Selected
        </button>

        <button
          onClick={handleBulkReject}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          <X className="w-4 h-4" /> Reject Selected
        </button>

        <button
          onClick={fetchClaims}
          className="ml-auto px-3 py-2 border rounded-lg bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <textarea
        rows={2}
        placeholder="Bulk reject notes (optional)"
        value={bulkNotes}
        onChange={(e) => setBulkNotes(e.target.value)}
        className="w-full mb-4 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
      />

      {/* Table */}
      {claimsLoading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading claims...
        </div>
      ) : filteredClaims.length === 0 ? (
        <p className="text-slate-500">No claims to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700 text-left">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3">Business</th>
                <th className="p-3">Claimant</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(claim.id)}
                      onChange={() => toggleSelect(claim.id)}
                    />
                  </td>
                  <td className="p-3">{claim.business?.name || "—"}</td>
                  <td className="p-3">{claim.claimant?.email || "—"}</td>
                  <td className="p-3 capitalize">{claim.status}</td>
                  <td className="p-3">
                    {claim.created_at
                      ? new Date(claim.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openDrawer(claim)}
                      className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && drawerClaim && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 dark:bg-slate-800 shadow-xl border-l border-slate-300 dark:border-slate-700 z-50 overflow-y-auto"
        >
          <div className="p-6">
            <button
              onClick={closeDrawer}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold mb-4">Claim Details</h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <strong>Business:</strong> {drawerClaim.business?.name || "—"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <strong>Claimant:</strong> {drawerClaim.claimant?.email || "—"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              <strong>Status:</strong>{" "}
              {drawerClaim.status ? drawerClaim.status : "—"}
            </p>

            <textarea
              rows={4}
              placeholder="Add notes (optional)"
              value={drawerNotes}
              onChange={(e) => setDrawerNotes(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(drawerClaim)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>

              <button
                onClick={() =>
                  handleReject(
                    drawerClaim,
                    drawerNotes || "Rejected manually by admin"
                  )
                }
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
