import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { supabase } from "@/lib/supabaseClient";

import {
  Search,
  Filter,
  Trash2,
  Clock,
  Info,
  AlertTriangle,
  OctagonAlert,
  ArrowUpDown,
  Activity,
  BarChart3,
  Download,
  Layers,
  List,
} from "lucide-react";

export default function OperatorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortDir, setSortDir] = useState("desc");

  const [viewMode, setViewMode] = useState("list"); // "list" | "group"
  const [liveTail, setLiveTail] = useState(true);
  const [chartMode, setChartMode] = useState("minute"); // "minute" | "hour"

  const logsContainerRef = useRef(null);

  const TABLE = "system_logs";

  // ------------------------------------------------------------
  // Load logs
  // ------------------------------------------------------------
  const loadLogs = useCallback(async () => {
    setLoading(true);

    let query = supabase.from(TABLE).select("*");
    query = query.order("created_at", { ascending: sortDir === "asc" });

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data);
    } else if (error) {
      console.error("Failed to load logs:", error);
    }

    setLoading(false);
  }, [sortDir]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ------------------------------------------------------------
  // Realtime subscription
  // ------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE },
        (payload) => {
          setLogs((prev) =>
            sortDir === "asc" ? [...prev, payload.new] : [payload.new, ...prev]
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sortDir]);

  // ------------------------------------------------------------
  // Live tail auto-scroll
  // ------------------------------------------------------------
  useEffect(() => {
    if (!liveTail || !logsContainerRef.current) return;

    // Scroll to top if newest first, bottom if oldest first
    const el = logsContainerRef.current;
    if (sortDir === "desc") {
      el.scrollTop = 0;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs, liveTail, sortDir]);

  // ------------------------------------------------------------
  // Clear logs (careful!)
  // ------------------------------------------------------------
  async function clearLogs() {
    if (!confirm("Clear ALL logs?")) return;

    const { error } = await supabase.from(TABLE).delete().neq("id", "");
    if (error) {
      console.error("Failed to clear logs:", error);
      alert("Failed to clear logs. Check console.");
      return;
    }

    loadLogs();
  }

  // ------------------------------------------------------------
  // Filter + Search
  // ------------------------------------------------------------
  const filtered = logs.filter((log) => {
    const matchLevel = filterLevel === "all" || log.level === filterLevel;

    const q = search.toLowerCase();
    const matchSearch =
      log.message?.toLowerCase().includes(q) ||
      log.service?.toLowerCase().includes(q) ||
      JSON.stringify(log.meta || {}).toLowerCase().includes(q);

    return matchLevel && matchSearch;
  });

  // ------------------------------------------------------------
  // Error-only alert banner (recent errors)
  // ------------------------------------------------------------
  const now = Date.now();
  const RECENT_WINDOW_MS = 15 * 60 * 1000; // last 15 min
  const recentErrors = filtered.filter(
    (log) =>
      log.level === "error" &&
      log.created_at &&
      now - new Date(log.created_at).getTime() < RECENT_WINDOW_MS
  );

  // ------------------------------------------------------------
  // Chart data (per minute / per hour)
  // ------------------------------------------------------------
  function buildBuckets(logsList, mode) {
    const bucketCount = 30; // last 30 units
    const buckets = Array.from({ length: bucketCount }, () => 0);
    const labels = [];

    const msPerUnit = mode === "minute" ? 60 * 1000 : 60 * 60 * 1000;
    const windowMs = bucketCount * msPerUnit;
    const nowTs = Date.now();

    logsList.forEach((log) => {
      if (!log.created_at) return;
      const ts = new Date(log.created_at).getTime();
      const diff = nowTs - ts;
      if (diff < 0 || diff > windowMs) return;
      const bucketIndex =
        bucketCount - 1 - Math.floor(diff / msPerUnit); // rightmost = most recent
      if (bucketIndex >= 0 && bucketIndex < bucketCount) {
        buckets[bucketIndex] += 1;
      }
    });

    for (let i = 0; i < bucketCount; i++) {
      labels.push(mode === "minute" ? `${i - bucketCount + 1}m` : `${i - bucketCount + 1}h`);
    }

    return { buckets, labels };
  }

  const chartData = buildBuckets(filtered, chartMode);
  const maxBucket = Math.max(...chartData.buckets, 1);

  // ------------------------------------------------------------
  // Export logs (current filtered) as CSV / JSON
  // ------------------------------------------------------------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system_logs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    if (!filtered.length) {
      alert("No logs to export.");
      return;
    }

    const header = ["id", "level", "service", "message", "meta", "created_at"];
    const rows = filtered.map((log) => [
      log.id,
      log.level,
      log.service,
      log.message,
      JSON.stringify(log.meta || {}),
      log.created_at,
    ]);

    const csvLines = [header, ...rows].map((row) =>
      row
        .map((val) =>
          val == null
            ? ""
            : `"${val.toString().replace(/"/g, '""')}"`
        )
        .join(",")
    );

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system_logs.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------
  // Grouping by service
  // ------------------------------------------------------------
  const groupedByService = filtered.reduce((acc, log) => {
    const key = log.service || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const LevelBadge = ({ level }) => {
    const base = "px-2 py-0.5 text-xs rounded inline-flex items-center gap-1";

    if (level === "info")
      return (
        <span className={`${base} bg-sky-600/30 text-sky-300`}>
          <Info size={12} />
          INFO
        </span>
      );

    if (level === "warn")
      return (
        <span className={`${base} bg-yellow-600/30 text-yellow-300`}>
          <AlertTriangle size={12} />
          WARN
        </span>
      );

    return (
      <span className={`${base} bg-rose-600/30 text-rose-300`}>
        <OctagonAlert size={12} />
        ERROR
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="System Logs"
        subtitle="Live activity logs, warnings, and error events."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/operator-system"
              className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg inline-flex items-center gap-1"
            >
              <Activity size={16} />
              System Health
            </Link>

            <button
              onClick={exportJSON}
              className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg inline-flex items-center gap-1"
            >
              <Download size={16} />
              JSON
            </button>

            <button
              onClick={exportCSV}
              className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg inline-flex items-center gap-1"
            >
              <Download size={16} />
              CSV
            </button>

            <button
              onClick={clearLogs}
              className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg inline-flex items-center gap-1"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        }
      />

      {/* Error-only alert banner */}
      {recentErrors.length > 0 && (
        <div className="rounded-xl border border-rose-600/60 bg-rose-950/40 px-4 py-3 flex items-start gap-3">
          <OctagonAlert className="w-5 h-5 text-rose-300 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-rose-100">
              {recentErrors.length} error{recentErrors.length > 1 ? "s" : ""} in the
              last 15 minutes
            </p>
            <p className="text-xs text-rose-200/80 line-clamp-2">
              Latest: {recentErrors[0].message}
            </p>
          </div>
        </div>
      )}

      {/* Top controls: search, filters, view mode, live tail, chart mode */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        {/* Left: Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-slate-800 rounded-lg w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input
              className="bg-transparent w-full outline-none text-slate-200 text-sm"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-900/40 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warnings</option>
              <option value="error">Errors</option>
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="px-3 py-2 bg-slate-900/40 border border-slate-800 rounded-lg text-slate-300 inline-flex items-center gap-1"
          >
            <ArrowUpDown size={14} /> {sortDir === "asc" ? "Oldest" : "Newest"}
          </button>
        </div>

        {/* Right: View toggles */}
        <div className="flex items-center gap-3 justify-end">
          {/* Chart mode */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <BarChart3 size={14} />
            <button
              onClick={() => setChartMode("minute")}
              className={`px-2 py-1 rounded-full ${
                chartMode === "minute"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              /min
            </button>
            <button
              onClick={() => setChartMode("hour")}
              className={`px-2 py-1 rounded-full ${
                chartMode === "hour"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              /hr
            </button>
          </div>

          {/* Live tail */}
          <button
            onClick={() => setLiveTail((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1 border ${
              liveTail
                ? "bg-emerald-600/80 border-emerald-400 text-white"
                : "bg-slate-900/40 border-slate-700 text-slate-300"
            }`}
          >
            <Activity size={14} />
            {liveTail ? "Live tail ON" : "Live tail OFF"}
          </button>

          {/* View mode */}
          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-900/40 text-slate-300"
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode("group")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-1 ${
                viewMode === "group"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-900/40 text-slate-300"
              }`}
            >
              <Layers size={14} /> By Service
            </button>
          </div>
        </div>
      </div>

      {/* CHART: Logs per unit */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} />
            <span>
              Logs per {chartMode === "minute" ? "minute (last 30m)" : "hour (last 30h)"}
            </span>
          </div>
          <span>Total: {filtered.length}</span>
        </div>

        <div className="mt-2 h-24 flex items-end gap-[2px]">
          {chartData.buckets.map((count, idx) => {
            const height = (count / maxBucket) * 100;
            return (
              <div
                key={idx}
                className="flex-1 bg-sky-600/40 hover:bg-sky-400/70 transition"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Oldest</span>
          <span>Newest</span>
        </div>
      </div>

      {/* LOGS VIEW */}
      {viewMode === "list" ? (
        <div
          ref={logsContainerRef}
          className="rounded-xl border border-slate-800 bg-slate-900/40 max-h-[480px] overflow-y-auto"
        >
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3">Level</th>
                <th className="text-left px-4 py-3">Message</th>
                <th className="text-left px-4 py-3">Service</th>
                <th className="text-left px-4 py-3">Meta</th>
                <th className="text-left px-4 py-3">Time</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan="5">
                    Loading logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan="5">
                    No logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <LevelBadge level={log.level} />
                    </td>

                    <td className="px-4 py-3">{log.message}</td>

                    <td className="px-4 py-3 text-slate-300">{log.service}</td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {JSON.stringify(log.meta || {})}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Grouped by service
        <div
          ref={logsContainerRef}
          className="rounded-xl border border-slate-800 bg-slate-900/40 max-h-[480px] overflow-y-auto p-4 space-y-4"
        >
          {loading ? (
            <p className="text-slate-500 text-sm">Loading logs...</p>
          ) : Object.keys(groupedByService).length === 0 ? (
            <p className="text-slate-500 text-sm">No logs found.</p>
          ) : (
            Object.entries(groupedByService).map(([service, serviceLogs]) => (
              <div
                key={service}
                className="border border-slate-800 rounded-xl bg-slate-950/40"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100">
                      {service}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {serviceLogs.length} log
                      {serviceLogs.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800 text-sm">
                  {serviceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="px-4 py-2 flex items-start gap-3 hover:bg-slate-900/60 transition"
                    >
                      <LevelBadge level={log.level} />
                      <div className="flex-1">
                        <p className="text-slate-100">{log.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "—"}
                        </p>
                        {log.meta && Object.keys(log.meta || {}).length > 0 && (
                          <pre className="mt-1 text-[11px] text-slate-400 bg-slate-950/60 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
