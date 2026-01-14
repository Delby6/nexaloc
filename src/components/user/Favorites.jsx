// src/components/user/Favorites.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/user-login");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        business:business_id (
          id,
          name,
          village,
          category,
          image_url
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("loadFavorites error:", error.message);
      setLoading(false);
      return;
    }

    setFavorites(data || []);
    setLoading(false);
  }

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (loading)
    return (
      <div
        className="
        min-h-screen flex items-center justify-center
        bg-slate-50 text-slate-700
        dark:bg-slate-950 dark:text-slate-200
      "
      >
        Loading your favorites...
      </div>
    );

  // ---------------------------------------------------------
  // PAGE RENDER
  // ---------------------------------------------------------
  return (
    <div
      className="
      min-h-screen pt-24 px-4 py-6
      bg-slate-50 text-slate-700
      dark:bg-slate-950 dark:text-slate-200
      transition-colors
    "
    >
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        ⭐ Your Favorite Businesses
      </h1>

      {/* NO FAVORITES */}
      {favorites.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          You haven't favorited any businesses yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => navigate(`/business/${fav.business.id}`)}
              className="
                cursor-pointer rounded-xl overflow-hidden
                border border-slate-200 bg-white shadow-sm
                hover:shadow-md hover:border-slate-300
                dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700
                transition
              "
            >
              {/* IMAGE */}
              <img
                src={
                  fav.business.image_url ||
                  "https://placehold.co/400x250?text=No+Image"
                }
                alt={fav.business.name}
                className="
                  w-full h-40 object-cover
                  border-b border-slate-200 dark:border-slate-800
                "
              />

              {/* TEXT CONTENT */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {fav.business.name}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {fav.business.category}
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {fav.business.village}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
