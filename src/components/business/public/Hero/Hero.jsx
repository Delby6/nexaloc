// src/components/business/public/Hero/Hero.jsx

import { motion } from "framer-motion";
import BackButton from "@/components/ui/BackButton";

export default function Hero({ business }) {
  if (!business) return null;

  return (
    <section
      className="
        relative h-[350px] md:h-[450px] 
        overflow-hidden rounded-b-2xl shadow-lg mb-8
      "
    >
      {/* Animated Background Image */}
      <motion.img
        key={business.id}
        src={
          business.image_url ||
          "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=80"
        }
        alt={business.name}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* THEME-AWARE OVERLAY */}
      <div
        className="
          absolute inset-0 
          bg-white/25 dark:bg-black/50 
          backdrop-blur-[1px]
          transition-colors
        "
      />

      {/* GRADIENT FOR READABILITY */}
      <div
        className="
          absolute inset-0 
          bg-gradient-to-t 
          from-white/70 via-white/30 to-transparent
          dark:from-black/60 dark:via-black/40 dark:to-transparent
          transition-colors
        "
      />

      {/* Floating back button (Mobile only) */}
      <div className="absolute top-4 left-4 z-20 block sm:hidden">
        <BackButton />
      </div>

      {/* TITLE + CATEGORY/VILLAGE */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
          relative z-10 flex flex-col items-center justify-center
          h-full text-center px-4
        "
      >
        <h1
          className="
            text-4xl md:text-5xl font-bold 
            text-slate-900 dark:text-white 
            drop-shadow-sm dark:drop-shadow-lg
          "
        >
          {business.name}
        </h1>

        <p
          className="
            mt-3 text-lg 
            text-slate-700 dark:text-slate-200
          "
        >
          {business.category} — {business.village}
        </p>
      </motion.div>
    </section>
  );
}
