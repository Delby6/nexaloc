export default function FiltersPanel({
  filters,
  onChangeFilters,
  onReset,
  onExport,
  categories,
  villages,
}) {
  return (
    <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Advanced Filters
        </h2>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Reset filters
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
            Category
          </label>
          <select
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-slate-100"
            value={filters.category}
            onChange={(e) =>
              onChangeFilters({ category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Village Filter */}
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
            Village
          </label>
          <select
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-slate-100"
            value={filters.village}
            onChange={(e) =>
              onChangeFilters({ village: e.target.value })
            }
          >
            <option value="">All Villages</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Owner Filter */}
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
            Owner
          </label>
          <input
            type="text"
            placeholder="Search owner name..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={filters.owner}
            onChange={(e) =>
              onChangeFilters({ owner: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          onClick={onExport}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Export CSV
        </button>
      </div>
    </section>
  );
}
