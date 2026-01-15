import { useEffect, useState } from "react";
import { logServiceCheck, logWarning } from "@/lib/systemLogger";
import { API_BASE } from "@/lib/apiBase";


/**
 * useHealthMonitor — FINAL LOGGING VERSION
 *
 * - Polls your key services (API, AI, Supabase REST/Auth/Storage)
 * - Feeds data into Operator System page (cards, sparkline, tables)
 * - ALSO writes logs into public.system_logs via systemLogger
 *
 * Returns:
 *   history, historyHourly, historyDaily, historyWeekly,
 *   stats, services, errors, insights, alerts
 */

export default function useHealthMonitor() {
  // Live sparkline
  const [history, setHistory] = useState([]);

  // Derived (placeholder) timelines
  const [historyHourly, setHistoryHourly] = useState([]);
  const [historyDaily, setHistoryDaily] = useState([]);
  const [historyWeekly, setHistoryWeekly] = useState([]);

  // Per-service statuses
  const [services, setServices] = useState({});
  const [errors, setErrors] = useState([]);

  // Overall stats
  const [stats, setStats] = useState({
    uptime: 100,
    latencyAvg: 0,
    failures: 0,
    healthScore: 100,
  });

  // Alerts + insights
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);

  const INTERVAL = 4000;
  const MAX_POINTS = 40;
  const MAX_ERRORS = 40;

  // -----------------------------------------------------------
  // 1. REAL ENDPOINTS (using real Supabase domain)
  // -----------------------------------------------------------

  const SUPABASE_URL = "https://xlsuoimvctjjvedyhewn.supabase.co";

  const endpoints = {
    api: `${API_BASE}/api/ai/ping`,
    ai: `${API_BASE}/api/ai/ping`,
    supabaseRest: `${SUPABASE_URL}/rest/v1/?select=1`, // safe HEAD-friendly
    supabaseAuth: `${SUPABASE_URL}/auth/v1/health`, // safe
    supabaseStorage: `${SUPABASE_URL}/storage/v1/buckets`, // GET-safe
  };

  // -----------------------------------------------------------
  // 2. MAIN POLLING EFFECT
  // -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function checkServices() {
      const timestamp = Date.now();
      const results = {};

      for (const [name, url] of Object.entries(endpoints)) {
        const start = performance.now();

        try {
          const method = url.includes("select=1") ? "HEAD" : "GET";
          const res = await fetch(url, { method });

          const ok = res.ok;
          const ms = Math.round(performance.now() - start);

          const entry = {
            ok,
            ms,
            code: res.status,
            lastChecked: timestamp,
          };

          results[name] = entry;

          if (!ok) {
            recordError(name, ms, String(res.status));
          }

          // 🔹 Write a log entry for each service check
          logServiceCheck({
            service: name,
            ok,
            ms,
            code: res.status,
          });

          // 🔹 Optional: warn on high latency even if ok
          if (ok && ms > 800) {
            logWarning({
              service: name,
              message: `${name} latency high (${ms}ms)`,
              meta: { ms, code: res.status },
            });
          }
        } catch (err) {
          const ms = Math.round(performance.now() - start);

          const entry = {
            ok: false,
            ms,
            code: "NO_RESPONSE",
            lastChecked: timestamp,
          };

          results[name] = entry;

          recordError(name, ms, "NO_RESPONSE");

          // 🔹 Log hard failures as error
          logServiceCheck({
            service: name,
            ok: false,
            ms,
            code: "NO_RESPONSE",
          });
        }
      }

      if (cancelled) return;

      setServices(results);

      const newStats = computeStats(results);
      setStats(newStats);

      updateHistory(results.api, timestamp);

      setAlerts(computeAlerts(newStats, results));
      setInsights(computeInsights(newStats, results));
    }

    checkServices();
    const interval = setInterval(checkServices, INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // -----------------------------------------------------------
  // 3. ERROR LOG
  // -----------------------------------------------------------
  function recordError(service, ms, code) {
    setErrors((prev) => [
      {
        service,
        ms,
        code,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, MAX_ERRORS - 1),
    ]);
  }

  // -----------------------------------------------------------
  // 4. HISTORY + SPARKLINE LOGIC
  // -----------------------------------------------------------
  function updateHistory(apiResult, timestamp) {
    const point = {
      time: timestamp,
      ms: apiResult?.ok ? apiResult.ms : 0,
      ok: apiResult?.ok ?? false,
    };

    setHistory((prev) => {
      const next = [...prev, point].slice(-MAX_POINTS);
      deriveAggregates(next);
      return next;
    });
  }

  function deriveAggregates(list) {
    // For now, reuse live history in all views to avoid backend complexity
    setHistoryHourly(list);
    setHistoryDaily(list);
    setHistoryWeekly(list);
  }

  // -----------------------------------------------------------
  // 5. STAT CALCULATIONS
  // -----------------------------------------------------------
  function computeStats(results) {
    const vals = Object.values(results);
    if (!vals.length)
      return { uptime: 100, latencyAvg: 0, failures: 0, healthScore: 100 };

    const okCount = vals.filter((s) => s.ok).length;
    const failCount = vals.length - okCount;

    const latencyAvg = Math.round(
      vals.reduce((acc, s) => acc + s.ms, 0) / vals.length
    );

    const uptime = Math.round((okCount / vals.length) * 100);

    const latencyScore = Math.max(0, 100 - latencyAvg / 10);
    const healthScore = Math.max(
      0,
      Math.min(100, Math.round(uptime * 0.6 + latencyScore * 0.4))
    );

    return { uptime, latencyAvg, failures: failCount, healthScore };
  }

  // -----------------------------------------------------------
  // 6. ALERTS
  // -----------------------------------------------------------
  function computeAlerts(stats, results) {
    const list = [];

    if (stats.uptime < 90) list.push("⚠️ Uptime dropped below 90%.");
    if (stats.latencyAvg > 800)
      list.push("🔥 System latency critically high (>800ms).");
    if (stats.latencyAvg > 400)
      list.push("⚡ Elevated latency detected (>400ms).");

    Object.entries(results).forEach(([name, s]) => {
      if (!s.ok) list.push(`❌ ${name} service is DOWN.`);
    });

    return list;
  }

  // -----------------------------------------------------------
  // 7. INSIGHTS (simple heuristic)
  // -----------------------------------------------------------
  function computeInsights(stats, results) {
    const insights = [];

    const worst = Object.entries(results).sort(
      (a, b) => b[1].ms - a[1].ms
    )[0];

    if (worst) {
      insights.push(
        `The slowest service is "${worst[0]}" at ${worst[1].ms}ms.`
      );
    }

    if (stats.failures === 0)
      insights.push("All services are responding normally.");
    if (stats.failures > 0)
      insights.push(`${stats.failures} service(s) experiencing issues.`);

    if (stats.healthScore > 90)
      insights.push("Overall system health is excellent.");
    else if (stats.healthScore > 70)
      insights.push("System health is acceptable.");
    else insights.push("System health is poor. Investigate issues.");

    return insights;
  }

  // -----------------------------------------------------------
  // FINAL RETURN (required by your dashboard)
  // -----------------------------------------------------------
  return {
    history,
    historyHourly,
    historyDaily,
    historyWeekly,
    stats,
    services,
    errors,
    insights,
    alerts,
  };
}
