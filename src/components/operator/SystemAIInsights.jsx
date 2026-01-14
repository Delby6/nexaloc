export default function SystemAIInsights({ insights }) {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
        AI System Insights
      </h3>

      {!insights?.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gathering insights...
        </p>
      ) : (
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {insights.map((ins, i) => (
            <li key={i}>{ins}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
