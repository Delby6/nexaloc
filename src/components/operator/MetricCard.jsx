// src/components/operator/MetricCard.jsx

export default function MetricCard({ icon, label, value, highlight }) {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow shadow-slate-950/5 dark:shadow-slate-950/40">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-red-500" : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
