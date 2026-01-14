import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back", fallback = "/" }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate(fallback);
  };

  return (
    <button
      onClick={goBack}
      className="
        inline-flex items-center gap-1.5
        px-2.5 py-1.5 rounded-lg text-sm font-medium
        border border-slate-300 dark:border-slate-700
        bg-white/80 dark:bg-slate-900/70
        text-slate-700 dark:text-slate-200
        hover:bg-slate-100 dark:hover:bg-slate-800
        hover:text-sky-600 dark:hover:text-sky-400
        shadow-sm transition
      "
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
