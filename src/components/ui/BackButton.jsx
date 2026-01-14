// src/components/ui/BackButton.jsx
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function BackButton({
  label = "Back",
  fallback = "/", // where to go if there's no history
}) {
  const navigate = useNavigate();

  const smartBack = () => {
    // If there's some history, go back normally
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // If user opened directly, send them to a safe page
      navigate(fallback);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={smartBack}
      whileTap={{ scale: 0.92 }}
      className="
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-full
        bg-white/10 hover:bg-white/20
        border border-white/25
        text-white text-xs sm:text-sm font-medium
        backdrop-blur-md
        shadow-md
        transition
      "
    >
      <ChevronLeft size={16} className="text-white" />
      {label}
    </motion.button>
  );
}
