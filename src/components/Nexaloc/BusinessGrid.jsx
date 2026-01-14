import { motion } from "framer-motion";
import { Users, MapPin, Wrench, ImageOff } from "lucide-react";

export default function BusinessGrid({
  businesses,
  loading,
  onBusinessClick,
}) {
  return (
    <section
      className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10"
      aria-label="List of onboarded businesses"
    >
      {/* ============================
         LOADING SKELETONS
      ============================= */}
      {loading ? (
        [...Array(6)].map((_, i) => (
          <div
            key={i}
            className="
              animate-pulse rounded-2xl p-4 
              border border-slate-200 dark:border-slate-800
              bg-white/70 dark:bg-slate-900/60 
              shadow-sm dark:shadow-slate-950/20
            "
          >
            <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-1.5" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          </div>
        ))
      ) : businesses.length > 0 ? (
        /* ============================
           BUSINESS CARDS
        ============================= */
        businesses.map((b, index) => (
          <motion.article
            key={b.id}
            onClick={() => onBusinessClick(b.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: index * 0.02 }}
            className="
              group rounded-2xl p-4 cursor-pointer 
              border border-slate-200 dark:border-slate-800
              bg-white dark:bg-slate-900/80 
              shadow-sm dark:shadow-slate-950/30 
              hover:shadow-md hover:border-sky-400 dark:hover:border-sky-500 
              hover:bg-slate-50 dark:hover:bg-slate-900 
              transition
            "
          >
            {/* IMAGE */}
            {b.image_url ? (
              <img
                src={b.image_url}
                alt={b.name}
                loading="lazy"
                className="
                  w-full h-32 object-cover rounded-xl mb-3 
                  border border-slate-200 dark:border-slate-700
                  group-hover:border-sky-400/60 
                  transition
                "
              />
            ) : (
              <div
                className="
                  w-full h-32 flex items-center justify-center 
                  rounded-xl mb-3 
                  border border-dashed 
                  border-slate-300 dark:border-slate-700 
                  bg-slate-100 dark:bg-slate-900/40
                "
              >
                <ImageOff className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>
            )}

            {/* NAME */}
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {b.name}
              </span>
            </div>

            {/* LOCATION */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-1">
              <MapPin className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span className="truncate">{b.village || "Location not set"}</span>
            </div>

            {/* CATEGORY */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-2">
              <Wrench className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span className="truncate">{b.category || "Category not set"}</span>
            </div>

            {/* DESCRIPTION */}
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
              {b.description || "No description available."}
            </p>
          </motion.article>
        ))
      ) : (
        /* ============================
           NO RESULTS
        ============================= */
        <p className="text-sm text-slate-600 dark:text-slate-400 col-span-full text-center py-8">
          No businesses found for the current filter.
        </p>
      )}
    </section>
  );
}
