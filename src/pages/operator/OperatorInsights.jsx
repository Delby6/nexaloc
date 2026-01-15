import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { API_BASE } from "@/lib/apiBase";


export default function OperatorInsights() {
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: u }, { data: b }, { data: l }] = await Promise.all([
        supabase.from("users").select("id, created_at"),
        supabase.from("businesses").select("id, created_at, category"),
        supabase.from("system_logs").select("id, level, created_at")
      ]);

      setUsers(u || []);
      setBusinesses(b || []);
      setLogs(l || []);
      setLoading(false);
    };

    load();
  }, []);

  const countByDay = (items) => {
    const map = {};
    items.forEach((x) => {
      const day = x.created_at?.split("T")[0];
      if (!day) return;
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const userGrowthAll = useMemo(() => countByDay(users), [users]);
  const businessGrowthAll = useMemo(() => countByDay(businesses), [businesses]);

  const userGrowth = useMemo(() => userGrowthAll.slice(-10), [userGrowthAll]);
  const businessGrowth = useMemo(
    () => businessGrowthAll.slice(-10),
    [businessGrowthAll]
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    businesses.forEach((b) => {
      if (!b.category) return;
      map[b.category] = (map[b.category] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [businesses]);

  const logLevels = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      const lvl = log.level || "info";
      map[lvl] = (map[lvl] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const totalUsers = users.length;
  const totalBusinesses = businesses.length;
  const totalLogs = logs.length;

  const Bar = ({ rows }) => {
    if (!rows.length) {
      return <div className="text-slate-500 text-sm">No data</div>;
    }

    const max = Math.max(...rows.map((r) => r.count));

    return (
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label || r.date}>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{r.label || r.date}</span>
              <span>{r.count}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full">
              <div
                className="h-2 bg-sky-500 rounded-full"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  async function generateAIInsights() {
    setAiLoading(true);
    setAiError("");
    setAiInsight("");

    const summary = {
      totals: {
        users: totalUsers,
        businesses: totalBusinesses,
        logs: totalLogs
      },
      userGrowthLast10Days: userGrowth,
      businessGrowthLast10Days: businessGrowth,
      topCategories: categoryBreakdown,
      logLevels
    };

    try {
      const res = await fetch(`${API_BASE}/api/ai-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          businesses
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "AI request failed");
      }

      const data = await res.json();
      setAiInsight(data.insight || "No insight generated.");
    } catch (err) {
      setAiError(err.message || "Failed to generate insights.");
    } finally {
      setAiLoading(false);
    }
  }

  const aiDisabled =
    loading || (!users.length && !businesses.length && !logs.length);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Insights</h1>
        {loading && <span className="text-slate-500 text-sm">Loading…</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Users</div>
          <div className="text-2xl font-semibold text-slate-50">
            {totalUsers}
          </div>
        </div>
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Businesses</div>
          <div className="text-2xl font-semibold text-slate-50">
            {totalBusinesses}
          </div>
        </div>
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Logs</div>
          <div className="text-2xl font-semibold text-slate-50">
            {totalLogs}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            User Growth (Last 10 days)
          </h2>
          <Bar rows={userGrowth} />
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Business Growth (Last 10 days)
          </h2>
          <Bar rows={businessGrowth} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Top Business Categories
          </h2>
          <Bar rows={categoryBreakdown} />
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Log Activity Summary
          </h2>
          <Bar rows={logLevels} />
        </div>
      </div>

      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">AI Insights</h2>
            <p className="text-xs text-slate-400">
              Generates a short operator summary using current users,
              businesses, and logs.
            </p>
          </div>
          <button
            onClick={generateAIInsights}
            disabled={aiDisabled || aiLoading}
            className="px-4 py-2 rounded-lg text-sm bg-sky-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-sky-700"
          >
            {aiLoading ? "Generating…" : "Generate AI Insights"}
          </button>
        </div>

        {aiError && <div className="text-xs text-red-400">{aiError}</div>}

        <div className="text-sm text-slate-200 whitespace-pre-line border border-slate-800 rounded-lg p-4 bg-slate-950/60 min-h-[120px]">
          {aiInsight ||
            "Click “Generate AI Insights” to get an AI summary of the network."}
        </div>
      </div>
    </div>
  );
}
