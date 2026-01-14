import { motion } from "framer-motion";

export default function AddBusinessCTA({ onClick }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      className="mt-16"
    >
      <div
        className="
          relative overflow-hidden rounded-3xl p-8 md:p-10
          border border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-900/90
          shadow-sm dark:shadow-slate-950/30
          transition-colors
        "
      >
        {/* Accent gradient (RIGHT SIDE) */}
        <div
          className="
            pointer-events-none absolute inset-y-0 right-0 w-1/3 
            bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),transparent_60%)]
            dark:bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.30),transparent_60%)]
            opacity-70
          "
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <p
              className="
                text-[11px] uppercase tracking-[0.22em] 
                text-sky-600 dark:text-sky-400 
                mb-2
              "
            >
              Onboard to the network
            </p>

            <h2
              className="
                text-lg md:text-xl font-semibold
                text-slate-800 dark:text-slate-100
                mb-2
              "
            >
              Connect your business to standardized B2B2C infrastructure
            </h2>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Nexaloc provides a single integration point for discovery,
              transactions, and analytics. Onboard once, participate across
              channels and partners.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex md:flex-none">
            <button
              onClick={onClick}
              className="
                inline-flex items-center justify-center
                rounded-xl px-6 py-2.5 text-sm font-medium
                border border-sky-500 bg-sky-500 text-white
                hover:bg-sky-600 hover:border-sky-600
                dark:bg-sky-500 dark:text-slate-900
                dark:hover:bg-sky-400 dark:hover:border-sky-400
                transition shadow-sm
              "
            >
              Add your business
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
