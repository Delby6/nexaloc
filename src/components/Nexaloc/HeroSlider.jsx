import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroSlider({
  slides,
  currentIndex,
  onPrev,
  onNext,
  onMouseEnter,
  onMouseLeave,
}) {
  const current = slides[currentIndex];

  return (
    <section
      className="relative h-[360px] md:h-[420px] mb-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-[0_0_40px_rgba(15,23,42,0.9)]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="Platform overview"
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current.image}
          src={current.image}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/60 to-slate-900/60" />

      {/* Content */}
      <motion.div
        key={current.title}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10 lg:px-14"
      >
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-sky-400 mb-3">
          Nexaloc Platform
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50 mb-4 max-w-2xl">
          {current.title}
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          {current.subtitle}
        </p>
      </motion.div>

      {/* Accent border line */}
      <div className="absolute inset-x-8 bottom-7 h-px bg-gradient-to-r from-sky-400/70 via-cyan-400/60 to-transparent" />

      {/* Controls */}
      <div className="absolute right-6 bottom-6 flex items-center gap-2">
        <button
          onClick={onPrev}
          className="h-9 w-9 rounded-full border border-slate-700/70 bg-slate-900/70 flex items-center justify-center hover:border-sky-400/80 hover:bg-slate-900 transition"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-slate-200" />
        </button>
        <button
          onClick={onNext}
          className="h-9 w-9 rounded-full border border-slate-700/70 bg-slate-900/70 flex items-center justify-center hover:border-sky-400/80 hover:bg-slate-900 transition"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-slate-200" />
        </button>
      </div>
    </section>
  );
}
