import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={toggleTheme}
        className="relative flex items-center justify-center w-9 h-9 rounded-full 
          bg-slate-200 dark:bg-slate-700 
          text-slate-700 dark:text-slate-100 
          hover:scale-110 transition-transform shadow-sm"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Sun size={18} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Moon size={18} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
