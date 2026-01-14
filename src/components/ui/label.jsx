import React from "react";

export function Label({ children, className = "", ...props }) {
  return (
    <label
      className={`block text-sm font-medium text-slate-700 dark:text-slate-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
