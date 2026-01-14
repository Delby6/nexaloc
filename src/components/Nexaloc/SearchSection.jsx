import { Search, MapPin, Layers, XCircle } from "lucide-react";

export default function SearchSection({
  value,
  onChange,
  totalCount,
  filteredCount,
  categories = [],
  locations = [],
  selectedCategory,
  selectedLocation,
  onCategoryChange,
  onLocationChange,
  onClearFilters,
}) {
  const hasFilter =
    value.trim().length > 0 || selectedCategory || selectedLocation;

  return (
    <section className="mb-10 space-y-4">

      {/* ------------------------------------
          HEADER + SEARCH/FILTER ROW
      ------------------------------------- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

        {/* LEFT: title */}
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
            Network Directory
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Search and filter businesses onboarded to the Nexaloc network.
          </p>
        </div>

        {/* RIGHT: FILTERS + SEARCH BAR + CLEAR */}
        <div className="flex flex-row flex-wrap items-center gap-3">

          {/* CATEGORY FILTER */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="
                appearance-none pl-10 pr-4 py-2 rounded-xl text-sm
                bg-white/70 dark:bg-slate-900/60
                backdrop-blur-md
                border border-slate-300 dark:border-slate-700
                text-slate-900 dark:text-slate-200
                shadow-sm dark:shadow-slate-950/20
              "
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* LOCATION FILTER */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="
                appearance-none pl-10 pr-4 py-2 rounded-xl text-sm
                bg-white/70 dark:bg-slate-900/60
                backdrop-blur-md
                border border-slate-300 dark:border-slate-700
                text-slate-900 dark:text-slate-200
                shadow-sm dark:shadow-slate-950/20
              "
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-[240px] md:w-[300px]">
            {/* Glass wrapper */}
            <div
              className="
                absolute inset-0 rounded-xl
                bg-white/80 dark:bg-slate-900/50
                backdrop-blur-md
                border border-slate-300 dark:border-slate-700
              "
            ></div>

            {/* Search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />

            {/* Input — FIXED VERSION */}
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search…"
              className="
                relative w-full z-10
                pl-10 pr-3 py-2 rounded-xl text-sm
                bg-transparent
                text-slate-900 dark:text-slate-100     /* <-- FIXED */
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:outline-none
              "
            />
          </div>

          {/* CLEAR BUTTON */}
          {hasFilter && (
            <button
              onClick={onClearFilters}
              className="
                flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium
                bg-slate-200 hover:bg-slate-300
                dark:bg-slate-800 dark:hover:bg-slate-700
                text-slate-700 dark:text-slate-300
              "
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------
          TOTAL / FILTER COUNT TEXT
      ------------------------------------- */}
      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
        {hasFilter ? (
          <>
            Showing{" "}
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {filteredCount}
            </span>{" "}
            of{" "}
            <span className="text-slate-900 dark:text-slate-200 font-semibold">
              {totalCount}
            </span>{" "}
            onboarded businesses.
          </>
        ) : (
          <>
            Total onboarded businesses:{" "}
            <span className="text-slate-900 dark:text-slate-200 font-semibold">
              {totalCount}
            </span>
          </>
        )}
      </p>
    </section>
  );
}
