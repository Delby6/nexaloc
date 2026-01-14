export default function SystemErrorFeed({ errors }) {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Recent Errors
      </h3>

      {errors.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No recent errors.</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {errors.map((err, i) => (
            <li key={i} className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-sm">
                <span className="font-semibold">{err.service}</span> — failure
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: {err.code} • {err.ms}ms • {err.time}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
