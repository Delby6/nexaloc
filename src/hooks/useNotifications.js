import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export function useNotifications({ userId, role }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * ----------------------------------------
   * LOAD NOTIFICATIONS
   * ----------------------------------------
   * - Always load by user_id
   * - Filter by scope ONLY if it exists
   * - This handles legacy rows (scope NULL)
   */
  const load = useCallback(async () => {
    if (!userId || role === "guest") return;

    setLoading(true);

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // ⚠️ tolerant filter:
    // include notifications where scope matches role OR scope is NULL
    if (role) {
      query = query.or(`scope.eq.${role},scope.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load notifications", error);
      setLoading(false);
      return;
    }

    const list = data || [];
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
    setLoading(false);
  }, [userId, role]);

  /**
   * ----------------------------------------
   * MARK SINGLE AS READ
   * ----------------------------------------
   */
  const markAsRead = async (id) => {
  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.warn("Failed to mark read", error);
    return;
  }

  setNotifications(prev => {
    const next = prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    );

    setUnreadCount(next.filter(n => !n.read).length);
    return next;
  });
};


  /**
   * ----------------------------------------
   * MARK ALL AS READ
   * ----------------------------------------
   */
const markAllRead = async () => {
  if (!userId) return;

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.warn("Failed to mark all read", error);
    return;
  }

  setNotifications(prev => {
    const next = prev.map(n => ({ ...n, read: true }));
    setUnreadCount(0);
    return next;
  });
};


  /**
   * ----------------------------------------
   * REALTIME SUBSCRIPTION
   * ----------------------------------------
   * - Listen ONLY by user_id
   * - Filter scope in JS (safer during transition)
   */
  useEffect(() => {
    if (!userId || role === "guest") return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new;

          // tolerant scope check
          if (n.scope && role && n.scope !== role) return;

          setNotifications(prev => {
            const next = [n, ...prev];
            setUnreadCount(next.filter(x => !x.read).length);
            return next;
            });


          toast(n.title || "New notification");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  /**
   * ----------------------------------------
   * INITIAL LOAD
   * ----------------------------------------
   */
  useEffect(() => {
    load();
  }, [load]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    reload: load,
  };
}
