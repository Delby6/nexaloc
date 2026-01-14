// src/components/business/details/SocialActions.jsx
import LikeButton from "@/components/business/LikeButton";

export default function SocialActions({
  liked,
  likeCount,
  favorite,
  onToggleLike,
  onToggleFavorite,
}) {
  return (
    <>
      <button
        onClick={onToggleLike}
        className={`px-4 py-2 rounded flex items-center gap-2 text-white ${
          liked ? "bg-red-600" : "bg-slate-700 hover:bg-slate-600"
        }`}
      >
        {liked ? "❤️ Liked" : "🤍 Like"}
        <span className="opacity-75">{likeCount}</span>
      </button>

      <button
        onClick={onToggleFavorite}
        className={`px-4 py-2 rounded flex items-center gap-2 text-white ${
          favorite ? "bg-yellow-500" : "bg-slate-700 hover:bg-slate-600"
        }`}
      >
        {favorite ? "★ Favorited" : "☆ Add to Favorites"}
      </button>
    </>
  );
}
