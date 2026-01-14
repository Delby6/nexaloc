export default function GlobalSearch({ search, onChange }) {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow shadow-slate-950/5 dark:shadow-slate-950/40">
      <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">
        Global Search
      </label>

      <input
        type="text"
        placeholder="Search name, owner, category, village..."
        value={search}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
      />
    </div>
  );
}
