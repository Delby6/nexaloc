import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useOperatorSystemUnreadCount() {
  const [count, setCount] = useState(0);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setCount(0);

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("scope", "system")
      .eq("read", false);

    if (!error) setCount(data?.length ?? 0);
  }

  useEffect(() => {
    refresh();

    // listen to ALL changes on notifications
    const channel = supabase
      .channel("system-unread-counter")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
