import { motion } from "framer-motion";
import { ArrowRight, Grid, Sparkles, BarChart3, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">

      {/* BACKGROUND GRADIENT */}
      <div className="
        pointer-events-none fixed inset-0 -z-10 opacity-80
        bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),transparent_60%),radial-gradient(circle_at_bottom,_rgba(0,0,0,0.03),transparent_60%)]
        dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.2),transparent_55%)]
      " />

      {/* CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* --------------------------------------------------
            HERO SECTION
        -------------------------------------------------- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
            Unified Infrastructure for Local Digital Economies
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Nexaloc provides the foundational network layer for onboarding, discovery, and operations across distributed business ecosystems — built for B2B2C scale.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/join")}
              className="
                px-6 py-3 rounded-xl text-white text-sm font-medium
                bg-sky-600 hover:bg-sky-700
                shadow-lg shadow-sky-500/30 transition
              "
            >
              Join the Network
            </button>

            <button
              onClick={() => navigate("/platform")}
              className="
                px-6 py-3 rounded-xl text-sm font-medium
                border border-slate-300 dark:border-slate-700
                bg-white/50 dark:bg-slate-900/40
                hover:bg-white/80 dark:hover:bg-slate-800
                shadow-sm backdrop-blur
                transition
              "
            >
              Explore Platform
            </button>
          </div>
        </motion.section>


        {/* --------------------------------------------------
            FEATURE GRID
        -------------------------------------------------- */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-14 text-slate-900 dark:text-white">
            The Network Layer for Modern Local Commerce
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {/* FEATURE 1 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 
              bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm"
            >
              <Grid className="w-8 h-8 text-sky-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unified Network Catalog</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aggregate businesses, categories, and locations into a searchable, structured ecosystem.
              </p>
            </motion.div>

            {/* FEATURE 2 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 
              bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm"
            >
              <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-driven Insights</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Understand market patterns, segment performance, and geographic density.
              </p>
            </motion.div>

            {/* FEATURE 3 */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 
              bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm"
            >
              <BarChart3 className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Operational Tooling</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Equip operators and business owners with analytics, workflows, and management tools.
              </p>
            </motion.div>

          </div>
        </section>


        {/* --------------------------------------------------
            HOW IT WORKS
        -------------------------------------------------- */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-14 text-slate-900 dark:text-white">
            How Nexaloc Works
          </h2>

          <div className="grid md:grid-cols-3 gap-10 text-center">

            <div>
              <div className="text-sky-500 text-4xl font-bold mb-3">1</div>
              <h3 className="font-semibold text-lg mb-2">Onboard Businesses</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add verified business entities with structured metadata and categories.
              </p>
            </div>

            <div>
              <div className="text-purple-500 text-4xl font-bold mb-3">2</div>
              <h3 className="font-semibold text-lg mb-2">Enable Discovery</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Consumers and partners search, filter, and interact with businesses on the network.
              </p>
            </div>

            <div>
              <div className="text-emerald-500 text-4xl font-bold mb-3">3</div>
              <h3 className="font-semibold text-lg mb-2">Activate Ecosystem</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Operators access insights, analytics, and category-level opportunities.
              </p>
            </div>

          </div>
        </section>


        {/* --------------------------------------------------
            CTA — JOIN THE NETWORK
        -------------------------------------------------- */}
        <motion.section
          whileHover={{ scale: 1.02 }}
          className="rounded-3xl p-10 text-center border border-slate-300 
          dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 
          backdrop-blur shadow-lg"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Become part of the Nexaloc ecosystem
          </h2>

          <p className="max-w-xl mx-auto text-sm text-slate-600 dark:text-slate-400 mb-6">
            Onboard your business, reach new customers, and unlock network-wide tools and intelligence.
          </p>

          <button
            onClick={() => navigate("/join")}
            className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 
            text-white font-medium shadow-lg shadow-sky-500/30 transition inline-flex items-center gap-2"
          >
            Join Now <ArrowRight className="w-4 h-4" />
          </button>
        </motion.section>

      </div>
    </div>
  );
}
