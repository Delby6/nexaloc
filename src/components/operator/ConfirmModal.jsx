// src/components/operator/ConfirmModal.jsx
import { useState, useEffect } from "react";
import BaseModal from "./BaseModal";

export default function ConfirmModal({
  open,
  onClose,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  confirmColor = "bg-rose-600 hover:bg-rose-700",
  onConfirm,
  summaryItems = [],
  maxSummary = 3,
}) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSubmitting(false);
    }
  }, [open]);

  const total = summaryItems.length;
  const visibleItems = summaryItems.slice(0, maxSummary);
  const remaining = total - visibleItems.length;

  const handleConfirm = async () => {
    if (submitting) return;
    if (typeof onConfirm !== "function") return;

    try {
      setSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("ConfirmModal onConfirm error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal open={open} onClose={submitting ? () => {} : onClose}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>

      <p className="mt-2 text-slate-600 dark:text-slate-400">{message}</p>

      {total > 0 && (
        <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Affected businesses:
          </p>
          <div className="flex flex-wrap gap-1">
            {visibleItems.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {name}
              </span>
            ))}
            {remaining > 0 && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200">
                +{remaining} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          className={`px-4 py-2 text-sm rounded-lg text-white ${confirmColor} disabled:opacity-60`}
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Working..." : confirmText}
        </button>
      </div>
    </BaseModal>
  );
}
