import React, { useState } from "react";
import { Check, X } from "lucide-react";

export default function PricingPage({ onSelectPlan }) {
  const [interval, setInterval] = useState("month");

  const plans = {
    month: {
      price: 24.99,
      interval: "Month",
    },
    year: {
      price: 199.99,
      interval: "Year",
      discount: "Save 20% when billed annually",
    },
  };

  const features = [
    { name: "Unlimited AI tools", pro: true },
    { name: "Unlimited projects", pro: true },
    { name: "Advanced analytics", pro: true },
    { name: "Priority AI queue", pro: true },
    { name: "Team access", pro: false },
  ];

  const selected = plans[interval];

  return (
    <div className="w-full bg-slate-900 text-white min-h-screen pb-20">
      {/* ============= Hero Section ============= */}
      <div className="text-center pt-20 pb-10 px-4">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-slate-300 max-w-xl mx-auto text-lg">
          Choose a plan that scales with your business. No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* ============= Billing Toggle ============= */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-slate-800 border border-slate-700 px-1 py-1 rounded-full">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-2 rounded-full transition text-sm ${
              interval === "month"
                ? "bg-amber-400 text-black font-semibold"
                : "text-slate-300"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setInterval("year")}
            className={`px-4 py-2 rounded-full transition text-sm ${
              interval === "year"
                ? "bg-amber-400 text-black font-semibold"
                : "text-slate-300"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* ============= Pricing Cards ============= */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {/* Free Plan */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="text-slate-400 text-sm mb-4">
            Great for trying things out.
          </p>

          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="mb-1 text-slate-400">/month</span>
          </div>

          <ul className="space-y-3 text-sm flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                {f.pro ? (
                  <X className="w-4 h-4 text-red-400" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                <span
                  className={f.pro ? "text-slate-500 line-through" : "text-slate-300"}
                >
                  {f.name}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => (window.location.href = "/signup")}
            className="mt-6 w-full px-4 py-2 rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-800 border border-amber-400 rounded-xl p-8 relative flex flex-col">
          {/* Yearly Savings Ribbon */}
          {interval === "year" && (
            <div className="absolute -top-3 right-4 bg-emerald-500 text-black px-3 py-1 rounded-md text-xs font-bold shadow-lg">
              Save 20%
            </div>
          )}

          <h2 className="text-xl font-semibold mb-2">PRO</h2>
          <p className="text-slate-400 text-sm mb-4">
            For creators, teams, and power users.
          </p>

          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-bold">${selected.price}</span>
            <span className="mb-1 text-slate-400">
              /{interval === "year" ? "year" : "month"}
            </span>
          </div>

          {interval === "year" && (
            <p className="text-xs text-emerald-400 mb-4">{selected.discount}</p>
          )}

          <ul className="space-y-3 text-sm flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">{f.name}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelectPlan(interval)}
            className="mt-6 w-full px-4 py-2 rounded-md bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
          >
            Upgrade to PRO
          </button>
        </div>
      </div>

      {/* ============= Comparison Table ============= */}
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <h3 className="text-2xl font-semibold text-center mb-6">
          Compare plans
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Feature</th>
                <th className="px-6 py-3 text-center">Free</th>
                <th className="px-6 py-3 text-center">PRO</th>
              </tr>
            </thead>

            <tbody className="bg-slate-900">
              {features.map((f, idx) => (
                <tr key={idx} className="border-t border-slate-700">
                  <td className="px-6 py-3">{f.name}</td>

                  <td className="px-6 py-3 text-center">
                    {f.pro ? (
                      <X className="w-4 h-4 text-red-400 inline" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400 inline" />
                    )}
                  </td>

                  <td className="px-6 py-3 text-center">
                    <Check className="w-4 h-4 text-emerald-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============= FAQ Section ============= */}
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <h3 className="text-2xl font-semibold text-center mb-8">FAQ</h3>

        <div className="space-y-6">
          <FAQ
            q="Can I cancel anytime?"
            a="Yes. You can cancel anytime from your billing dashboard. Your access continues until the end of your billing period."
          />

          <FAQ
            q="Do you offer refunds?"
            a="No, we do not offer refunds, but you can cancel before renewal."
          />

          <FAQ
            q="Does the yearly plan really save money?"
            a="Yes! Paying yearly gives you up to 20% off compared to paying month-by-month."
          />

          <FAQ
            q="Can I switch between monthly and yearly later?"
            a="Absolutely. You can upgrade or downgrade your interval at any time."
          />
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <h4 className="text-lg font-semibold mb-2">{q}</h4>
      <p className="text-slate-400 text-sm">{a}</p>
    </div>
  );
}
