// src/components/operator/AssignModal.jsx
import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";

export default function AssignModal({
  open,
  onClose,
  title = "Assign Value",
  label = "Value",
  submitText = "Assign",
  options = [], // array of strings
  onSubmit,
  summaryItems = [],
  maxSummary = 3,
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset when opened, preselect first option if available
  useEffect(() => {
    if (open) {
      if (options.length > 0) setValue(options[0]);
      else setValue("");
      setSubmitting(false);
    }
  }, [open, options]);

  const handleSubmit = async () => {
    if (!value || !value.trim() || submitting) return;
    if (typeof onSubmit !== "function") return;

    try {
      setSubmitting(true);
      await onSubmit(value.trim());
      onClose();
    } catch (err) {
      // optional: log / toast error higher up
      console.error("AssignModal onSubmit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const total = summaryItems.length;
  const visibleItems = summaryItems.slice(0, maxSummary);
  const remaining = total - visibleItems.length;

  return (
    <BaseModal open={open} onClose={submitting ? () => {} : onClose}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>

      {total > 0 && (
        <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Selected businesses:
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

      <label className="block mt-4 text-sm text-slate-600 dark:text-slate-400">
        {label}
      </label>

      {options && options.length > 0 ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitting}
          className="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitting}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60"
        />
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
          className="px-4 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60"
        >
          {submitting ? "Assigning..." : submitText}
        </button>
      </div>
    </BaseModal>
  );
}
