import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";

function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(",");
  const data = rows
    .map((row) =>
      Object.values(row)
        .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([headers + "\n" + data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
  );
}

export default function OperatorReports() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [logs, setLogs] = useState([]);

  const [chart, setChart] = useState("businesses");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [{ data: u }, { data: b }, { data: l }] = await Promise.all([
        supabase
          .from("users")
          .select("id, full_name, email, city, created_at")
          .order("created_at", { ascending: false })
          .limit(500),

        supabase
          .from("businesses")
          .select("id, name, village, category, created_at")
          .order("created_at", { ascending: false })
          .limit(500),

        supabase
          .from("system_logs")
          .select("id, level, service, message, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      setUsers(u || []);
      setBusinesses(b || []);
      setLogs(l || []);

      setLoading(false);
    };

    load();
  }, []);

  const handleExport = (type) => {
    setExporting(true);

    if (type === "users") exportToCSV("users.csv", users);
    if (type === "businesses") exportToCSV("businesses.csv", businesses);
    if (type === "logs") exportToCSV("logs.csv", logs);

    setTimeout(() => setExporting(false), 300);
  };

  const businessChart = useMemo(() => {
    const map = {};
    businesses.forEach((x) => {
      const k = x.village || "Unknown";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [businesses]);

  const usersChart = useMemo(() => {
    const map = {};
    users.forEach((x) => {
      const k = x.city || "Unknown";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [users]);

  const logsChart = useMemo(() => {
    const map = {};
    logs.forEach((x) => {
      const k = x.level || "info";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const chartData =
    chart === "businesses"
      ? businessChart
      : chart === "users"
      ? usersChart
      : logsChart;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Reports</h1>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Spinner /> Loading
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleExport("users")}
            disabled={loading || exporting}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            Users CSV ({users.length})
          </button>
          <button
            onClick={() => handleExport("businesses")}
            disabled={loading || exporting}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            Businesses CSV ({businesses.length})
          </button>
          <button
            onClick={() => handleExport("logs")}
            disabled={loading || exporting}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            Logs CSV ({logs.length})
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setChart("businesses")}
            className={`px-3 py-1 rounded-full text-xs ${
              chart === "businesses"
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            Businesses
          </button>
          <button
            onClick={() => setChart("users")}
            className={`px-3 py-1 rounded-full text-xs ${
              chart === "users"
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setChart("logs")}
            className={`px-3 py-1 rounded-full text-xs ${
              chart === "logs"
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            Logs
          </button>
        </div>

        <div className="space-y-2">
          {chartData.map((row, i) => {
            const max = Math.max(...chartData.map((x) => x.count || 1));
            const width = `${(row.count / max) * 100}%`;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{row.label}</span>
                  <span>{row.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full">
                  <div
                    className="h-2 bg-sky-500 rounded-full"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
