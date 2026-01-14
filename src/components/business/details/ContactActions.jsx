// src/components/business/details/ContactActions.jsx
import { Mail, Navigation, ShieldCheck } from "lucide-react";
import SocialActions from "@/components/business/details/SocialActions";

export default function ContactActions({
  business,
  directionsHref,
  user,
  claiming,
  claimed,
  onClaim,

  // NEW social actions props
  liked,
  likeCount,
  favorite,
  onToggleLike,
  onToggleFavorite,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">

      {/* ⭐ Social Actions (Like + Favorite) */}
      <SocialActions
        liked={liked}
        likeCount={likeCount}
        favorite={favorite}
        onToggleLike={onToggleLike}
        onToggleFavorite={onToggleFavorite}
      />

      {/* Contact Button */}
      {business.contact && (
        <a
          href={`mailto:${business.contact}`}
          className="px-5 py-2 bg-sky-600 text-white rounded flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Contact
        </a>
      )}

      {/* Directions */}
      {directionsHref && (
        <a
          href={directionsHref}
          className="px-5 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"
          target="_blank"
          rel="noreferrer"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </a>
      )}

      {/* Claim */}
      {user && (
        <button
          onClick={onClaim}
          disabled={claiming || claimed}
          className={`px-5 py-2 flex items-center gap-2 text-white rounded ${
            claimed
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {claimed ? "Claimed" : claiming ? "Submitting..." : "Claim"}
        </button>
      )}

    </div>
  );
}
