// src/components/business/details/RatingSummary.jsx
import { Star } from "lucide-react";

export default function RatingSummary({ reviews, avgRating }) {
  return (
    <div className="mt-8 mb-6 flex items-center gap-2 text-slate-700 dark:text-white">
      <Star className="w-5 h-5 text-yellow-500" />
      {reviews.length > 0 ? (
        <span>
          {avgRating.toFixed(1)} / 5 • {reviews.length} reviews
        </span>
      ) : (
        <span>No reviews yet</span>
      )}
    </div>
  );
}
