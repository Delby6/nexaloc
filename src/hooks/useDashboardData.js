// src/hooks/useDashboardData.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { API_BASE } from "@/lib/apiBase";


export function useDashboardData() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState("checking");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setBusinesses(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  // System status ping
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/ai/ping`);
        if (res.ok) setSystemStatus("online");
        else setSystemStatus("offline");
      } catch {
        setSystemStatus("offline");
      }
    }

    check();
  }, []);

  // Derived metrics
  const totalBusinesses = businesses.length;
  const categoriesCount = new Set(businesses.map((b) => b.category)).size;
  const villagesCount = new Set(businesses.map((b) => b.village)).size;

  return {
    businesses,
    loading,
    systemStatus,
    totalBusinesses,
    categoriesCount,
    villagesCount,
  };
}
