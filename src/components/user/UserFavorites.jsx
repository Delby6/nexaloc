// src/components/user/UserFavorites.jsx
import UserFavoriteCard from "@/components/user/UserFavoriteCard";

export default function UserFavorites({
  favorites,
  onOpenBusiness,
  onRemoveFavorite,
}) {
  return (
    <section
      className="
        mt-10 p-6 rounded-xl
        bg-white border border-slate-200 shadow-sm
        dark:bg-slate-900 dark:border-slate-800 dark:shadow-lg
        transition-colors
      "
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          My Favorites ❤️
        </h2>
      </div>

      {/* Empty State */}
      {!favorites?.length && (
        <p className="text-slate-500 dark:text-slate-400">
          You haven't favorited any businesses yet.
        </p>
      )}

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {favorites?.slice(0, 6).map((biz, index) => (
          <UserFavoriteCard
            key={`${biz.id}-${index}`}
            business={biz}
            onOpen={() => onOpenBusiness && onOpenBusiness(biz.id)}
            onRemove={() => onRemoveFavorite && onRemoveFavorite(biz.id)}
          />
        ))}
      </div>
    </section>
  );
}
