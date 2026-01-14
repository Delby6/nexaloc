import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      className="relative w-full h-[380px] md:h-[420px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.65)] mb-10"
      aria-label="Platform overview"
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.18),transparent_55%)]" />

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.17] pointer-events-none">
        <motion.div
          initial={{ backgroundPosition: "0px 0px" }}
          animate={{ backgroundPosition: ["0px 0px", "200px 200px"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Accent highlight circle */}
      <div className="absolute w-[340px] h-[340px] -left-20 -top-20 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute w-[260px] h-[260px] right-0 bottom-0 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 lg:px-16"
      >
        {/* Tagline */}
        <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-sky-400 mb-3">
          Nexaloc Platform
        </p>

        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight max-w-3xl leading-snug">
          Unified Infrastructure for Local Digital Economies
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl">
          A network layer for onboarding, discovery, and operations across
          distributed business ecosystems — built for B2B2C scale.
        </p>
      </motion.div>

      {/* Tech accent line */}
      <div className="absolute left-8 right-8 bottom-8 h-px bg-gradient-to-r from-sky-500/70 via-cyan-400/60 to-transparent" />
    </section>
  );
}
