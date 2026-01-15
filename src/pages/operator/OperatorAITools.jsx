import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-hot-toast";
import { API_BASE } from "@/lib/apiBase";


export default function OperatorAITools() {
  const [loading, setLoading] = useState(true);

  const [businesses, setBusinesses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({
    businessCount: 0,
    logCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
  });

  const [userId, setUserId] = useState(null);

  const [aiForecast, setAiForecast] = useState("");
  const [aiBusinessAdvice, setAiBusinessAdvice] = useState("");
  const [aiLogAnalysis, setAiLogAnalysis] = useState("");
  const [aiAnomaly, setAiAnomaly] = useState("");

  const [aiLoading, setAiLoading] = useState({
    forecast: false,
    advice: false,
    logs: false,
    anomaly: false,
  });

  const [autoAlert, setAutoAlert] = useState("");

  /* ---------------------------------------------------------
     LOAD DATA
  --------------------------------------------------------- */
  useEffect(() => {
  const load = async () => {
    const [{ data: b }, { data: l }, { data: userData, error: userErr }] =
      await Promise.all([
        supabase.from("businesses").select("id, village, category, created_at"),
        supabase
          .from("system_logs")
          .select("id, level, service, created_at, message"),
        supabase.auth.getUser(),
      ]);

    if (userErr) {
      console.error("getUser error:", userErr);
    }

    setBusinesses(b || []);
    setLogs(l || []);

    setSystemStats({
      businessCount: b?.length || 0,
      logCount: l?.length || 0,
      errorCount: l?.filter((x) => x.level === "error").length || 0,
      warningCount: l?.filter((x) => x.level === "warning").length || 0,
      infoCount: l?.filter((x) => x.level === "info").length || 0,
    });

    // ✅ supabase.auth.getUser() -> { data: { user }, error }
    setUserId(userData?.user?.id || null);

    setLoading(false);
  };

  load();
}, []);

  /* ---------------------------------------------------------
     AUTO ALERT — ERROR SPIKE
  --------------------------------------------------------- */
  useEffect(() => {
  if (!logs.length) return;
  if (aiLoading.anomaly) return; // already running

  const recent = logs.slice(-50);
  const errorCount = recent.filter((l) => l.level === "error").length;
  const rate = errorCount / recent.length;

  //  cooldown (5 minutes)
  const now = Date.now();
  const lastRun = Number(localStorage.getItem("lastAnomalyRun") || 0);
  const COOLDOWN_MS = 5 * 60 * 1000;

  if (now - lastRun < COOLDOWN_MS) return;

  if (rate >= 0.4) {
    const msg = `High error rate detected (${errorCount}/${recent.length}).`;

    setAutoAlert(msg);
    toast.error(msg);
    sendNotification("High error rate detected", msg);

    localStorage.setItem("lastAnomalyRun", String(now));
    runAnomalyDetection(recent);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [logs]);


  /* ---------------------------------------------------------
     NOTIFICATIONS
  --------------------------------------------------------- */
  async function sendNotification(title, message) {
    if (!userId) return;

    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        scope: "operator",
        category: "system",
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  /* ---------------------------------------------------------
     BACKEND AI CALL (SAFE)
     Server endpoint: POST /api/ai/operator/generate
     Expects body: { userId, prompt }
     Returns: { ok: true, output: string } OR { error: string }
  --------------------------------------------------------- */
async function callAI(prompt, key, mode = "default") {
  setAiLoading((p) => ({ ...p, [key]: true }));

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const res = await fetch(
      `${API_BASE}/api/ai/operator/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: session.user.id, // ✅ REQUIRED
          prompt,
          mode, // ✅ lets backend choose system prompt
        }),
      }
    );

    let data;
let rawText = "";
try {
  rawText = await res.text();
  data = rawText ? JSON.parse(rawText) : null;
} catch {
  data = null;
}

if (!res.ok) {
  const msg =
    data?.error ||
    data?.message ||
    rawText ||
    `AI request failed (${res.status})`;
  throw new Error(msg);
}

return data?.output || "No AI response.";


    return data.output || "No AI response.";
  } catch (err) {
    return err.message || "AI request failed.";
  } finally {
    setAiLoading((p) => ({ ...p, [key]: false }));
  }
}


 /* ---------------------------------------------------------
   AI ACTIONS (build prompt strings here)
--------------------------------------------------------- */
async function generateForecast() {
  const summary = {
    errors: systemStats.errorCount,
    warnings: systemStats.warningCount,
    info: systemStats.infoCount,
    logs: systemStats.logCount,
    businesses: systemStats.businessCount,
  };

  const prompt =
    "Forecast system reliability and outage risk based on this summary. " +
    "Return: (1) key risks, (2) likely causes, (3) preventive actions. " +
    "Keep it concise and operator-friendly.\n\nJSON:\n" +
    JSON.stringify(summary, null, 2);

  setAiForecast(await callAI(prompt, "forecast", "forecast"));
}

async function generateBusinessAdvice() {
  const prompt =
    "Analyze this business list and recommend which categories/villages need support, " +
    "which are growing, and where to focus onboarding/marketing. " +
    "Return short bullets + a top-3 priority list.\n\nDATA:\n" +
    JSON.stringify(businesses.slice(0, 200), null, 2);

  setAiBusinessAdvice(await callAI(prompt, "advice", "advice"));
}

async function analyzeLogs() {
  const prompt =
    "Review these logs and summarize: (1) recurring failures, (2) anomalies, (3) urgent risks, " +
    "(4) a prioritized action list. Keep it short.\n\nLOGS:\n" +
    JSON.stringify(logs.slice(0, 200), null, 2);

  setAiLogAnalysis(await callAI(prompt, "logs", "logs"));
}

/* ---------------------------------------------------------
   Anomaly Detection
--------------------------------------------------------- */
async function runAnomalyDetection(recentLogs) {
  const prompt =
    "Analyze these recent logs. Explain what is abnormal, likely root causes, and immediate actions. " +
    "Short bullet points.\n\nRECENT LOGS:\n" +
    JSON.stringify(recentLogs, null, 2);

  const response = await callAI(prompt, "anomaly", "anomaly");

  //  STOP if quota / billing issue
  if (
    typeof response === "string" &&
    (response.toLowerCase().includes("quota") ||
     response.toLowerCase().includes("billing"))
  ) {
    setAutoAlert("AI temporarily unavailable due to billing limits.");
    return;
  }

  setAiAnomaly(response);

  sendNotification(
    "AI Anomaly Analysis",
    "AI generated a new anomaly report."
  );
}


/* ---------------------------------------------------------
   EXPORTS
--------------------------------------------------------- */
function exportCsv() {
  const lines = [
    "Metric,Value",
    `Businesses,${systemStats.businessCount}`,
    `Logs,${systemStats.logCount}`,
    `Errors,${systemStats.errorCount}`,
    `Warnings,${systemStats.warningCount}`,
    `Info,${systemStats.infoCount}`,
    "",
    "AI Forecast",
    `"${(aiForecast || "").replace(/"/g, '""')}"`,
    "",
    "AI Business Advice",
    `"${(aiBusinessAdvice || "").replace(/"/g, '""')}"`,
    "",
    "AI Log Analysis",
    `"${(aiLogAnalysis || "").replace(/"/g, '""')}"`,
    "",
    "AI Anomaly Detection",
    `"${(aiAnomaly || "").replace(/"/g, '""')}"`,
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "operator-ai-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}


  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">AI Tools</h1>
        {loading && <span className="text-slate-500 text-sm">Loading data…</span>}
      </div>

      {autoAlert && (
        <div className="border border-amber-500/60 bg-amber-500/10 text-amber-100 rounded-xl px-4 py-3 text-sm">
          <strong>Auto Alert:</strong> {autoAlert}
        </div>
      )}

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Forecast */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">System Forecast</h2>
            <button
              onClick={generateForecast}
              disabled={aiLoading.forecast}
              className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-60"
            >
              {aiLoading.forecast ? "Thinking…" : "Run AI"}
            </button>
          </div>
          <div className="text-sm whitespace-pre-line h-40 overflow-auto bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            {aiForecast || "AI will predict system risks here."}
          </div>
        </div>

        {/* Business */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Business Strategy</h2>
            <button
              onClick={generateBusinessAdvice}
              disabled={aiLoading.advice}
              className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-60"
            >
              {aiLoading.advice ? "Analyzing…" : "Run AI"}
            </button>
          </div>
          <div className="text-sm whitespace-pre-line h-40 overflow-auto bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            {aiBusinessAdvice || "AI will analyze businesses here."}
          </div>
        </div>

        {/* Logs */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Log Intelligence</h2>
            <button
              onClick={analyzeLogs}
              disabled={aiLoading.logs}
              className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-60"
            >
              {aiLoading.logs ? "Scanning…" : "Run AI"}
            </button>
          </div>
          <div className="text-sm whitespace-pre-line h-40 overflow-auto bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            {aiLogAnalysis || "AI will analyze logs here."}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">Realtime Anomaly Detection</h2>
          <div className="text-sm whitespace-pre-line h-40 overflow-auto bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            {aiAnomaly || "AI anomaly reports will appear here."}
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold">Reports & Export</h2>
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm hover:bg-slate-700"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
