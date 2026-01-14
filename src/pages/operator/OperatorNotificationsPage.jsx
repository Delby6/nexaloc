// src/pages/operator/OperatorNotificationsPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  Bell,
  Activity,
  Share2,
  Cpu,
  AlertTriangle,
  Search,
  Filter,
  Archive,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// -----------------------------
// Tabs
// -----------------------------
const TABS = [
  { id: "all", label: "All" },
  { id: "system", label: "System" },
  { id: "network", label: "Network" },
  { id: "ai", label: "AI" },
  { id: "other", label: "Other" },
];

const CATEGORY_META = {
  system: { label: "System", icon: Activity },
  network: { label: "Network", icon: Share2 },
  ai: { label: "AI", icon: Cpu },
  other: { label: "Other", icon: Bell },
};

const SEVERITY_META = {
  info: {
    label: "Info",
    badgeClass:
      "bg-sky-500/15 text-sky-300 border border-sky-500/40",
  },
  warning: {
    label: "Warning",
    badgeClass:
      "bg-amber-500/15 text-amber-300 border border-amber-500/40",
  },
  error: {
    label: "Error",
    badgeClass:
      "bg-rose-500/15 text-rose-200 border border-rose-500/40",
  },
  critical: {
    label: "Critical",
    badgeClass:
      "bg-red-600/20 text-red-200 border border-red-500/50",
  },
};

// -----------------------------
// Helpers
// -----------------------------
function normalizeCategory(n) {
  const raw = (n.category || n.type || "").toLowerCase().trim();
  if (raw === "system") return "system";
  if (raw === "network" || raw === "net") return "network";
  if (raw === "ai" || raw === "ml") return "ai";
  return "other";
}

function normalizeSeverity(n) {
  const raw = (n.severity || n.level || "").toLowerCase().trim();
  if (["warning", "warn"].includes(raw)) return "warning";
  if (["error", "err"].includes(raw)) return "error";
  if (["critical", "crit"].includes(raw)) return "critical";
  return "info";
}

function formatTime(iso) {
  return new Date(iso).toLocaleString();
}

function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isYesterday(date) {
  const d = new Date(date);
  const now = new Date();
  const diff =
    (now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) /
    (1000 * 60 * 60 * 24);
  return diff === 1;
}

function isWithinLastWeek(date) {
  const d = new Date(date);
  const now = new Date();
  const diff =
    (now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) /
    (1000 * 60 * 60 * 24);
  return diff > 1 && diff <= 7;
}

// -----------------------------
// NOTE: Simple beep
// -----------------------------
function playAlertBeep() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 220);
  } catch {}
}

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export default function OperatorNotificationsPage() {
  const navigate = useNavigate();

  // Main notification list
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI filters
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  // Broadcast dialog
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastCategory, setBroadcastCategory] =
    useState("system");
  const [broadcastSeverity, setBroadcastSeverity] =
    useState("info");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Sound and preview
  const [livePreview, setLivePreview] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [hasRequestedPush, setHasRequestedPush] =
    useState(false);

  // -----------------------------
  // Load notifications
  // -----------------------------
  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or("scope.eq.system,user_id.is.null")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }, []);

  // -----------------------------
  // Realtime: INSERT + UPDATE
  // -----------------------------
  useEffect(() => {
    let channel;
    async function init() {
      await loadNotifications();

      channel = supabase.channel("operator-system-notifs");

      // INSERT — new notifications
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const n = payload.new;
          if (n.scope !== "system") return;

          // instant UI update
          setNotifications((p) => [n, ...p]);

          // live preview / sound
          setLivePreview(n);
          if (soundEnabled) playAlertBeep();
        }
      );

      // UPDATE — read / archived / edited
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const updated = payload.new;
          if (updated.scope !== "system") return;

          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updated.id ? updated : n
            )
          );
        }
      );

      channel.subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadNotifications, soundEnabled]);

  // -----------------------------
  // Optimistic Mark Read
  // -----------------------------
  async function markAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("mark read failed:", error);
      loadNotifications();
    }
  }

  // -----------------------------
  // Optimistic Mark All Read
  // -----------------------------
  async function markAllRead() {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids);

    if (error) {
      console.error("mark all read failed:", error);
      loadNotifications();
    }
  }

  // -----------------------------
  // Archive (optimistic)
  // -----------------------------
  async function archiveNotification(n) {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === n.id ? { ...row, archived: true } : row
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({ archived: true })
      .eq("id", n.id);

    if (error) {
      console.error("archive failed:", error);
      loadNotifications();
    }
  }

  // -----------------------------
  // Send broadcast
  // -----------------------------
  async function sendBroadcast(e) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setSendingBroadcast(true);

    const { error } = await supabase
      .from("notifications")
      .insert({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        scope: "system",
        category: broadcastCategory,
        type: broadcastCategory,
        severity: broadcastSeverity,
        user_id: null,
        read: false,
      });

    if (error) {
      console.error("broadcast failed:", error);
    } else {
      setBroadcastOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    }

    setSendingBroadcast(false);
  }

  // -----------------------------
  // Push notification permission
  // -----------------------------
  useEffect(() => {
    if (!pushEnabled || hasRequestedPush) return;

    setHasRequestedPush(true);
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm !== "granted") setPushEnabled(false);
        });
      } else if (Notification.permission === "denied") {
        setPushEnabled(false);
      }
    }
  }, [pushEnabled, hasRequestedPush]);

  // -----------------------------
  // Grouping, Filtering, Unread counts
  // -----------------------------
  const { grouped, totalUnread, firstReadGlobalIndex } = useMemo(() => {
    let list = notifications;

    if (!showArchived)
      list = list.filter((n) => !n.archived);

    if (activeTab !== "all") {
      list = list.filter((n) => {
        const cat = normalizeCategory(n);
        return cat === activeTab;
      });
    }

    if (severityFilter !== "all") {
      list = list.filter(
        (n) => normalizeSeverity(n) === severityFilter
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.message || "").toLowerCase().includes(q)
      );
    }

    list = [...list].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    const totalUnread = list.filter((n) => !n.read).length;

    let firstReadIdx = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i].read) {
        firstReadIdx = i;
        break;
      }
    }

    const groups = { today: [], yesterday: [], week: [], earlier: [] };
    list.forEach((n) => {
      const c = n.created_at;
      if (!c) return groups.earlier.push(n);
      if (isToday(c)) groups.today.push(n);
      else if (isYesterday(c)) groups.yesterday.push(n);
      else if (isWithinLastWeek(c)) groups.week.push(n);
      else groups.earlier.push(n);
    });

    const grouped = [];
    if (groups.today.length) grouped.push({ label: "Today", items: groups.today });
    if (groups.yesterday.length) grouped.push({ label: "Yesterday", items: groups.yesterday });
    if (groups.week.length) grouped.push({ label: "This Week", items: groups.week });
    if (groups.earlier.length) grouped.push({ label: "Earlier", items: groups.earlier });

    return {
      grouped,
      totalUnread,
      firstReadGlobalIndex: firstReadIdx === -1 ? null : firstReadIdx,
    };
  }, [notifications, activeTab, severityFilter, search, showArchived]);

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Operator Notifications"
        subtitle="System-wide alerts, network events and AI messages for operators."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
            </button>

            <button
              onClick={() => setBroadcastOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Bell size={14} />
              <span>New Broadcast</span>
            </button>
          </div>
        }
      />

      {loading && (
        <p className="text-xs text-slate-400">Loading system notifications...</p>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full p-1 bg-slate-900/60 border border-slate-700 text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-full transition ${
                activeTab === t.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search system alerts..."
              className="bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-xs w-40 sm:w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-300">
            <Filter size={14} className="text-slate-500" />
            <select
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
              showArchived
                ? "border-amber-500/60 text-amber-200 bg-amber-500/10"
                : "border-slate-700 text-slate-300 bg-slate-900/60"
            }`}
          >
            <Archive size={13} />
            <span>{showArchived ? "Showing archived" : "Hide archived"}</span>
          </button>

          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-400">
        {notifications.length} system notifications • {totalUnread} unread
      </p>

      {/* Grouped Notifications */}
      {grouped.length === 0 ? (
        <p className="text-sm text-slate-500 mt-4">
          No system notifications found for this view.
        </p>
      ) : (
        <div className="space-y-6 mt-2">
          {(() => {
            let globalIndex = 0;
            const rows = [];

            grouped.forEach((group) => {
              rows.push(
                <div key={`group-${group.label}`}>
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    {group.label}
                  </p>

                  <div className="space-y-2">
                    {group.items.map((n) => {
                      const idx = globalIndex++;
                      const category = normalizeCategory(n);
                      const severity = normalizeSeverity(n);
                      const catMeta = CATEGORY_META[category];
                      const sevMeta = SEVERITY_META[severity];
                      const Icon = catMeta.icon;

                      const showUnreadSeparator =
                        idx === firstReadGlobalIndex &&
                        totalUnread > 0;

                      return (
                        <div
                          key={n.id}
                          className="relative space-y-1"
                        >
                          {showUnreadSeparator && (
                            <div className="flex items-center gap-2 my-1">
                              <div className="h-[1px] flex-1 bg-slate-700" />
                              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                Unread above
                              </span>
                              <div className="h-[1px] flex-1 bg-slate-700" />
                            </div>
                          )}

                          {/* Notification Card */}
                          <div
                            className={`p-4 rounded-xl border flex justify-between gap-4 transition-all ${
                              n.read
                                ? "bg-slate-900/60 border-slate-800"
                                : "bg-slate-900 border-sky-500/40 shadow-sm shadow-sky-900/40"
                            }`}
                          >
                            <div
                              className="cursor-pointer flex-1"
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  if (n.link.startsWith("http"))
                                    window.open(n.link, "_blank");
                                  else navigate(n.link);
                                }
                              }}
                            >
                              {/* Title */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800">
                                  <Icon size={15} className="text-slate-200" />
                                </div>

                                <h2 className="font-semibold text-sm sm:text-base text-slate-100">
                                  {n.title}
                                </h2>

                                {!n.read && (
                                  <span className="px-2 py-[1px] text-[10px] rounded-full bg-emerald-500/20 text-emerald-200">
                                    NEW
                                  </span>
                                )}

                                <span
                                  className={`px-2 py-[1px] text-[10px] rounded-full ${sevMeta.badgeClass}`}
                                >
                                  {sevMeta.label}
                                </span>

                                <span className="px-2 py-[1px] text-[10px] rounded-full bg-slate-800 text-slate-200">
                                  {catMeta.label}
                                </span>
                              </div>

                              {/* Message */}
                              <p className="text-xs sm:text-sm text-slate-200">
                                {n.message}
                              </p>

                              {/* Meta */}
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                                <span>{formatTime(n.created_at)}</span>
                                {n.archived && (
                                  <span className="px-2 py-[1px] rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex flex-col items-end gap-2">
                              {!n.read && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="px-3 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-100"
                                >
                                  Mark read
                                </button>
                              )}

                              {!n.archived && (
                                <button
                                  onClick={() => archiveNotification(n)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                  <Archive size={12} />
                                  Archive
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });

            return rows;
          })()}
        </div>
      )}

      {/* Live Preview Panel */}
      <AnimatePresence>
        {livePreview && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-80 max-w-[90vw] bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-2"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <Bell className="text-sky-400" size={18} />
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  New system alert
                </p>
              </div>
              <button
                onClick={() => setLivePreview(null)}
                className="text-slate-500 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-50">
              {livePreview.title}
            </p>
            <p className="text-xs text-slate-300 line-clamp-3">
              {livePreview.message}
            </p>

            <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
              <span>
                {formatTime(livePreview.created_at || new Date())}
              </span>
              <button
                onClick={() => {
                  markAsRead(livePreview.id);
                  setLivePreview(null);
                }}
                className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[11px] hover:bg-sky-500"
              >
                Mark read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {broadcastOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-xl p-6 relative"
            >
              <button
                onClick={() => setBroadcastOpen(false)}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-200"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Bell className="text-sky-400" />
                <h2 className="text-lg font-semibold text-slate-50">
                  Send system broadcast
                </h2>
              </div>

              <form onSubmit={sendBroadcast} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    placeholder="e.g. Degraded performance in Network West region"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Message
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 min-h-[100px]"
                    placeholder="Describe what operators should know or do..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value)}
                    >
                      <option value="system">System</option>
                      <option value="network">Network</option>
                      <option value="ai">AI</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Severity
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      value={broadcastSeverity}
                      onChange={(e) => setBroadcastSeverity(e.target.value)}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastOpen(false)}
                    className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={sendingBroadcast}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
                  >
                    {sendingBroadcast ? "Sending..." : "Send broadcast"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
