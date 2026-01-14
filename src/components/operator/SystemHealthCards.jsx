import { useTheme } from "@/context/ThemeContext";

export default function SystemHealthCards({ stats }) {
  const dark = useTheme().theme === "dark";

  const badge = stats.healthScore > 85 ? "🟢 Healthy"
             : stats.healthScore > 60 ? "🟡 Warning"
             : "🔴 Critical";

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label="System Status" value={badge} highlight />
      <Card label="Uptime" value={stats.uptime + '%'} />
      <Card label="Avg Latency" value={stats.latencyAvg + 'ms'} />
      <Card label="Failures" value={stats.failures} highlight={stats.failures > 0} />
    </div>
  );
}

function Card({ label, value, highlight }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold 
        ${highlight ? "text-red-500" : "text-slate-900 dark:text-slate-100"}
      `}>
        {value}
      </p>
    </div>
  );
}
