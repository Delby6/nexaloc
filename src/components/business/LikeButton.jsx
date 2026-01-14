// src/components/business/LikeButton.jsx
import React from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ liked, likeCount, toggleLike }) {
  
  return (
    <button
      type="button"
      onClick={toggleLike}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
    >
      <Heart
        className={`w-4 h-4 ${
          liked ? "fill-red-500 text-red-500" : "text-slate-400"
        }`}
      />
      <span>{likeCount}</span>
      <span className="text-xs text-slate-400">Likes</span>
    </button>
  );
}
