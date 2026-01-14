// src/components/user/UserFavoriteCard.jsx

export default function UserFavoriteCard({ business, onOpen, onRemove }) {
  const imageSrc =
    business.image_url ||
    "https://placehold.co/400x250?text=No+Image";

  return (
    <div
      onClick={onOpen}
      className="
        cursor-pointer flex flex-col rounded-xl overflow-hidden
        bg-white border border-slate-200 shadow-sm
        hover:shadow-md hover:border-slate-300
        dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700
        transition
      "
    >
      {/* IMAGE */}
      <img
        src={imageSrc}
        alt={business.name}
        className="
          w-full h-40 object-cover
          border-b border-slate-200 dark:border-slate-800
        "
      />

      {/* CONTENT */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
          {business.name}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {business.category}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {business.village}
        </p>

        {/* REMOVE BUTTON */}
        <div className="mt-auto pt-3 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove();
            }}
            className="
              px-3 py-1.5 text-xs font-medium rounded-md
              bg-red-600 hover:bg-red-700 text-white
              transition
            "
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
