import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function PricingSelector({
  onSelectPlan,            // called with priceId
  currentInterval = "month",
  monthlyPrice = 19,
  yearlyPrice = 190,
  yearlySavingsPercent = 20,
}) {
  const [interval, setInterval] = useState(currentInterval);

  useEffect(() => {
    setInterval(currentInterval);
  }, [currentInterval]);

  const isYearly = interval === "year";

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Choose your plan</h2>

        {/* MONTHLY / YEARLY Toggle */}
        <div className="flex items-center bg-slate-800 px-1 py-1 rounded-full border border-slate-700">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              interval === "month"
                ? "bg-amber-400 text-black font-semibold"
                : "text-slate-300"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setInterval("year")}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              interval === "year"
                ? "bg-amber-400 text-black font-semibold"
                : "text-slate-300"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* YEARLY SAVINGS BADGE */}
      {isYearly && (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-black rounded-md">
            Save {yearlySavingsPercent}%
          </span>
          <span className="text-slate-400 text-xs">
            When billed yearly
          </span>
        </div>
      )}

      {/* PRICING CARD */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-end gap-1 mb-2">
          <span className="text-4xl font-bold text-white">
            {isYearly ? `$${yearlyPrice}` : `$${monthlyPrice}`}
          </span>
          <span className="text-slate-400 mb-1 text-sm">
            /{isYearly ? "year" : "month"}
          </span>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Access all PRO features without limits.
        </p>

        <ul className="space-y-2 mb-4 text-sm text-slate-300">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" /> Unlimited usage
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" /> Advanced analytics
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" /> Priority AI processing
          </li>
        </ul>

        <button
          onClick={() => onSelectPlan(interval)}
          className="w-full px-4 py-2 rounded-md bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
        >
          Upgrade to {isYearly ? "Yearly PRO" : "Monthly PRO"}
        </button>
      </div>
    </div>
  );
}
