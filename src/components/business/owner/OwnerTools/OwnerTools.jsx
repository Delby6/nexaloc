// src/components/business/owner/OwnerTools/OwnerTools.jsx
import { Palette, Film } from "lucide-react";

export default function OwnerTools({ isOwner, business, navigate }) {
  if (!isOwner || !business) return null;

  return (
    <div className="mt-8 mb-6 space-y-3">
      {/* Business Card Button (uses your separate BusinessCard.jsx page) */}
      <button
        onClick={() => navigate(`/business/${business.id}/card`)}
        className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        <Palette className="w-4 h-4" />
        Business Card
      </button>

      {/* AI Video Studio */}
      <button
        onClick={() => navigate("/video-editor")}
        className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
      >
        <Film className="w-4 h-4" />
        AI Video Studio
      </button>
    </div>
  );
}
