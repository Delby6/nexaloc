// src/pages/system/OperatorSystem.jsx
import { useState } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";

import useHealthMonitor from "@/hooks/useHealthMonitor";

import SystemHealthCards from "@/components/operator/SystemHealthCards";
import SystemHealthSparkline from "@/components/operator/SystemHealthSparkline";
import SystemServiceTable from "@/components/operator/SystemServiceTable";
import SystemErrorFeed from "@/components/operator/SystemErrorFeed";
import SystemAIInsights from "@/components/operator/SystemAIInsights";
import SystemAlerts from "@/components/operator/SystemAlerts";
import SystemActions from "@/components/operator/SystemActions";

export default function OperatorSystem() {
  const {
    history,
    historyHourly,
    historyDaily,
    historyWeekly,
    stats,
    services,
    errors,
    insights,
    alerts,
  } = useHealthMonitor();

  const [range, setRange] = useState("live");

  const sparklineData =
    range === "hourly"
      ? historyHourly
      : range === "daily"
      ? historyDaily
      : range === "weekly"
      ? historyWeekly
      : history;

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="System Console"
        subtitle="Health, performance, and reliability of the operator platform."
      />

      {/* High-level health cards */}
      <SystemHealthCards stats={stats} />

      {/* Sparkline + controls + alerts + insights */}
      <section className="rounded-2xl p-6 border bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/10 dark:shadow-slate-950/40 backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Latency Sparkline
          </h2>

          <div
            className="
              inline-flex items-center gap-1 rounded-full 
              bg-slate-100 dark:bg-slate-900/80 
              border border-slate-300 dark:border-slate-700 
              p-1 text-xs 
              text-slate-600 dark:text-slate-300 
            "
          >
            {["live", "hourly", "daily", "weekly"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-0.5 rounded-full capitalize transition ${
                  range === r
                    ? "bg-sky-600 dark:bg-sky-500 text-white shadow-sm"
                    : "hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <SystemHealthSparkline data={sparklineData} />

        {/* Alerts + AI insights */}
        <div className="grid lg:grid-cols-2 gap-6 mt-4">
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-50 p-4">
            <h3 className="text-sm font-semibold mb-2">System Alerts</h3>
            <SystemAlerts alerts={alerts} />
          </div>

          <div className="rounded-xl border border-sky-500/40 bg-sky-950/40 text-sky-50 p-4">
            <h3 className="text-sm font-semibold mb-2">AI System Insights</h3>
            <SystemAIInsights insights={insights} />
          </div>
        </div>
      </section>

      {/* Services + Errors */}
      <section className="grid lg:grid-cols-2 gap-6 items-start">
        <SystemServiceTable services={services} />

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recent Errors
          </h3>
          <SystemErrorFeed errors={errors} />
        </div>
      </section>

      {/* System actions (manual refresh, etc.) */}
      <SystemActions />
    </div>
  );
}
