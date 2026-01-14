// src/pages/notifications/OwnerNotifications.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useNotificationsContext } from "@/providers/NotificationsProvider";

const TABS = [
  { id: "all", label: "All" },
  { id: "business", label: "Business Alerts" },
  { id: "reviews", label: "Reviews" },
  { id: "ai", label: "AI Messages" },
];

export default function OwnerNotifications() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  /* -------------------------------------------
     LOAD AUTH USER (ONCE)
  ------------------------------------------- */
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        navigate("/owner-login");
        return;
      }
      setUser(data.user);
    }
    loadUser();
  }, [navigate]);

  /* -------------------------------------------
     NOTIFICATIONS (FROM PROVIDER — SINGLE SOURCE)
  ------------------------------------------- */
  const {
    notifications,
    loading,
    markAsRead,
    markAllRead,
  } = useNotificationsContext();

  /* -------------------------------------------
     HELPERS
  ------------------------------------------- */
  function time(iso) {
    return new Date(iso).toLocaleString();
  }

  function getCategory(n) {
    return (n.category || "business").toLowerCase();
  }

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter(
      (n) => getCategory(n) === activeTab
    );
  }, [notifications, activeTab]);

  /* -------------------------------------------
     LOADING STATE
  ------------------------------------------- */
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading owner notifications...
      </div>
    );
  }

  /* -------------------------------------------
     UI
  ------------------------------------------- */
  return (
    <div className="min-h-screen px-4 py-6 
      bg-slate-50 dark:bg-slate-900 
      text-slate-700 dark:text-slate-200 
      transition-colors">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            👑 Owner Activity Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Network-level events, business activity logs, and AI-powered insights.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/owner-dashboard")}
            className="px-4 py-2 rounded-lg text-sm
              bg-slate-200 hover:bg-slate-300
              dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Back to Owner Dashboard
          </button>

          <button
            disabled={notifications.length === 0}
            onClick={markAllRead}
            className="px-4 py-2 rounded-lg text-sm text-white
              bg-emerald-600 hover:bg-emerald-700
              disabled:bg-slate-300 dark:disabled:bg-slate-700 transition"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="inline-flex rounded-full p-1 mb-4
        bg-slate-200 dark:bg-slate-900/80
        border border-slate-300 dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition
              ${
                activeTab === tab.id
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {filteredNotifications.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          No notifications in this tab yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border flex justify-between gap-4 transition-all
                ${
                  n.read
                    ? "bg-white/70 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800"
                    : "bg-white dark:bg-slate-900 border-emerald-500 shadow-sm shadow-emerald-900/30"
                }`}
            >
              <div
                className="cursor-pointer flex-1"
                onClick={() => {
                  markAsRead(n.id);
                  if (n.link) {
                    if (n.link.startsWith("http")) window.open(n.link);
                    else navigate(n.link);
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-sm sm:text-base">
                    {n.title}
                  </h2>

                  {!n.read && (
                    <span className="px-2 py-[1px] text-[10px] rounded-full
                      bg-emerald-500/20 dark:bg-emerald-500/30
                      text-emerald-700 dark:text-emerald-200">
                      NEW
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {n.message}
                </p>

                <div className="flex items-center gap-3 mt-2 text-[11px]
                  text-slate-600 dark:text-slate-400">
                  <span>{time(n.created_at)}</span>

                  <span className="px-2 py-[1px] rounded-full
                    bg-slate-200 dark:bg-slate-800
                    text-slate-700 dark:text-slate-300">
                    {getCategory(n)}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="self-start px-3 py-1 rounded text-xs
                    bg-slate-200 hover:bg-slate-300
                    dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
