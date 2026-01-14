import { motion } from "framer-motion";
import { BarChart3, AlertTriangle } from "lucide-react";

export default function AiRecommendations({
  topCategory,
  topVillage,
  staticRecommendations,
  aiInsights,
  aiLoading,
  aiError,
  businessCount,
  villageCount,
  categoryCount,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="
        mt-16 pt-10 
        border-t border-slate-300 dark:border-slate-800
      "
    >
      {/* =============================
            KPI ROW  
      ============================== */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[ 
          { label: "Total Businesses", value: businessCount },
          { label: "Active Locations", value: villageCount },
          { label: "Categories", value: categoryCount },
        ].map((kpi, i) => (
          <div
            key={i}
            className="
              rounded-xl p-4 border
              bg-white dark:bg-slate-900/80 
              border-slate-200 dark:border-slate-800
              shadow-sm dark:shadow-slate-950/30
              transition
            "
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* =============================
            AI INSIGHTS  
      ============================== */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Platform Insights
          </h3>
        </div>

        {/* Loading message */}
        {aiLoading && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generating insights based on current network state…
          </p>
        )}

        {/* Error message */}
        {aiError && !aiLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
            <AlertTriangle className="w-3 h-3" />
            <span>{aiError}</span>
          </div>
        )}

        {/* AI Insight block */}
        {!aiLoading && !aiError && aiInsights && (
          <div
            className="
              mt-3 rounded-2xl p-5 border 
              bg-white dark:bg-slate-900/80 
              border-slate-200 dark:border-slate-800
              shadow-sm dark:shadow-slate-950/30
              text-xs leading-relaxed 
              text-slate-700 dark:text-slate-300 
              whitespace-pre-wrap transition
            "
          >
            {aiInsights}
          </div>
        )}
      </div>

      {/* =============================
            STATIC STRATEGIC RECOMMENDATIONS  
      ============================== */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
          Strategic Recommendations
        </h4>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-6">
          Derived from category and location patterns observed across the network.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staticRecommendations.map((rec, i) => (
            <div
              key={i}
              className="
                rounded-xl p-4 border 
                bg-white dark:bg-slate-900/80 
                border-slate-200 dark:border-slate-800
                shadow-sm dark:shadow-slate-950/20 
                transition
              "
            >
              <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                {rec.name}
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {rec.reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
