import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1602524207829-4e0a6bfb9f9a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
];

export default function HeroBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="
        relative h-[360px] md:h-[480px] overflow-hidden 
        rounded-b-2xl shadow-lg mb-10
      "
    >
      {/* FADE ANIMATED BACKGROUND IMAGES */}
      <AnimatePresence>
        <motion.img
          key={images[index]}
          src={images[index]}
          alt="Village landscape"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
        />
      </AnimatePresence>

      {/* THEME-AWARE OVERLAY */}
      <div
        className="
          absolute inset-0 
          bg-white/30 dark:bg-black/40
          backdrop-blur-[1px] 
          transition-colors
        "
      />

      {/* GRADIENT FOR TEXT READABILITY */}
      <div
        className="
          absolute inset-0 
          bg-gradient-to-t 
          from-white/60 via-white/30 to-transparent
          dark:from-black/60 dark:via-black/40 dark:to-transparent
          transition-colors
        "
      />

      {/* TEXT CONTENT */}
      <div
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
          Empowering Polish Villages 🌾
        </h1>

        <p
          className="
            mt-3 text-lg md:text-xl 
            text-slate-700 dark:text-slate-200 
            max-w-2xl
          "
        >
          Connecting local businesses through technology and community
        </p>
      </div>
    </section>
  );
}
