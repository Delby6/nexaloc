import React from "react";

export function Switch({ checked, onCheckedChange }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? "bg-sky-600" : "bg-slate-400"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 transition ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
