// -------------------------------------------------------------
// Owner AI Business Advisor (OwnerLayout + UniversalSidebar)
// White SaaS cards, dark-mode aware, all AI tools on one page
//
// ✅ UPDATED: Uses YOUR backend endpoints (NO client OpenAI key)
// - POST http://localhost:8080/api/ai/owner/generate  (PRO-only)
// Body: { userId, prompt, mode? }
// Returns: { ok: true, output: string, meta? }
// -------------------------------------------------------------
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  Wand2,
  LineChart,
  AlertTriangle,
  Target,
  Lock,
} from "lucide-react";

// ---- Rate limiting constants (Hybrid) ----
const GLOBAL_COOLDOWN_MS = 1000; // 1s global cooldown between ANY AI calls
const TOOL_COOLDOWN_MS = 3000; // 3s per-tool cooldown
const CHAT_COOLDOWN_MS = 1500; // 1.5s chat cooldown

// ✅ Owner AI calls go through YOUR backend (PRO-only route)
async function callOwnerAI({ userId, prompt, mode = "default" }) {
  const res = await fetch("http://localhost:8080/api/ai/owner/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, prompt, mode }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || `AI request failed (${res.status})`
    );
  }

  return data.output || "No AI response.";
}

export default function OwnerAiDashboard() {
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // State
  // -----------------------------------------------------------
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);

  // PRO subscription state
  const [subLoading, setSubLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // KPIs
  const [profileScore, setProfileScore] = useState(0);
  const [kpis, setKpis] = useState({
    totalBusinesses: 0,
    avgFieldsCompleted: 0,
    mainCategory: null,
    mainVillage: null,
  });

  // AI summary + recommendations
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // AI Chat
  const [chatMessages, setChatMessages] = useState([]); // {role, content}
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // SEO Analyzer
  const [seoResult, setSeoResult] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);

  // Missing fields detector
  const [missingResult, setMissingResult] = useState("");
  const [missingLoading, setMissingLoading] = useState(false);

  // Description rewriter
  const [rewriteResult, setRewriteResult] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Growth predictions
  const [growthResult, setGrowthResult] = useState("");
  const [growthLoading, setGrowthLoading] = useState(false);

  // ---- Hybrid rate limiting state ----
  const [lastAIRequestTime, setLastAIRequestTime] = useState(0);
  const [globalCooldown, setGlobalCooldown] = useState(false);

  const [summaryCooldown, setSummaryCooldown] = useState(false);
  const [growthCooldown, setGrowthCooldown] = useState(false);
  const [seoCooldown, setSeoCooldown] = useState(false);
  const [missingCooldown, setMissingCooldown] = useState(false);
  const [rewriteCooldown, setRewriteCooldown] = useState(false);
  const [chatCooldown, setChatCooldown] = useState(false);

  // Helper to start per-tool cooldowns
  function startCooldown(setter, duration) {
    setter(true);
    setTimeout(() => setter(false), duration);
  }

  // Hybrid safe wrapper: global cooldown + backend call
  async function safeCallOwnerAI({ userId, prompt, mode }) {
    const now = Date.now();
    if (globalCooldown || now - lastAIRequestTime < GLOBAL_COOLDOWN_MS) {
      throw new Error("You're using AI too quickly. Please wait a moment.");
    }

    setLastAIRequestTime(now);
    setGlobalCooldown(true);

    try {
      return await callOwnerAI({ userId, prompt, mode });
    } finally {
      setTimeout(() => setGlobalCooldown(false), GLOBAL_COOLDOWN_MS);
    }
  }

  // -----------------------------------------------------------
  // Load user + subscription + businesses
  // -----------------------------------------------------------
  useEffect(() => {
    async function load() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error("Please log in again.");
        navigate("/owner-login");
        return;
      }

      setUser(user);

      // Load subscription (PRO check)
      try {
        setSubLoading(true);
        const { data: sub, error: subError } = await supabase
          .from("billing_subscriptions")
          .select("status, plan")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subError) {
          console.error("Subscription load error:", subError);
          setIsPro(false);
        } else {
          const allowed =
            sub &&
            (sub.status === "active" || sub.status === "trialing") &&
            sub.plan === "pro";
          setIsPro(Boolean(allowed));
        }
      } catch (err) {
        console.error("Subscription load error:", err);
        setIsPro(false);
      } finally {
        setSubLoading(false);
      }

      // Load businesses
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .select(
          "id, name, category, village, description, contact, website, phone, hours, address, image_url, created_at"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (bizError) {
        console.error(bizError);
        toast.error("Failed to load businesses.");
        setBusinesses([]);
        setLoading(false);
        return;
      }

      setBusinesses(biz || []);
      setLoading(false);
    }

    load();
  }, [navigate]);

  // Auto-select first business when list is available
  useEffect(() => {
    if (businesses.length && !selectedBusinessId) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [businesses, selectedBusinessId]);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId]
  );

  // -----------------------------------------------------------
  // Compute KPIs + Profile Score (across all businesses)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!businesses.length) {
      setProfileScore(0);
      setKpis({
        totalBusinesses: 0,
        avgFieldsCompleted: 0,
        mainCategory: null,
        mainVillage: null,
      });
      return;
    }

    const total = businesses.length;
    let totalCompletion = 0;
    const categoryCount = {};
    const villageCount = {};

    const fields = [
      "description",
      "contact",
      "website",
      "phone",
      "hours",
      "address",
      "image_url",
    ];

    businesses.forEach((b) => {
      let filled = 0;
      fields.forEach((f) => {
        if (b[f] && String(b[f]).trim() !== "") filled += 1;
      });
      const completeness = (filled / fields.length) * 100;
      totalCompletion += completeness;

      if (b.category)
        categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;

      if (b.village)
        villageCount[b.village] = (villageCount[b.village] || 0) + 1;
    });

    function topKey(obj) {
      const items = Object.entries(obj);
      if (!items.length) return null;
      items.sort((a, b) => b[1] - a[1]);
      return items[0][0];
    }

    const avg = Math.round(totalCompletion / total);

    setKpis({
      totalBusinesses: total,
      avgFieldsCompleted: avg,
      mainCategory: topKey(categoryCount),
      mainVillage: topKey(villageCount),
    });

    setProfileScore(avg);
  }, [businesses]);

  // -----------------------------------------------------------
  // AI: Owner-level summary + recommendations (MANUAL trigger)
  // -----------------------------------------------------------
  async function fetchOwnerInsights() {
    if (!user || !businesses.length) {
      toast("Add at least one business to get AI insights.");
      return;
    }

    if (summaryCooldown || globalCooldown) {
      toast.error("Please wait a moment before refreshing AI overview again.");
      return;
    }

    try {
      setAiSummaryLoading(true);
      startCooldown(setSummaryCooldown, TOOL_COOLDOWN_MS);

      const payload = {
        ownerId: user.id,
        businesses: businesses.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          village: b.village,
          description: b.description,
          hasWebsite: !!b.website,
          hasImage: !!b.image_url,
          hasPhone: !!b.phone,
          hasHours: !!b.hours,
          created_at: b.created_at,
        })),
        metrics: {
          profileScore,
          totalBusinesses: kpis.totalBusinesses,
          mainCategory: kpis.mainCategory,
          mainVillage: kpis.mainVillage,
          avgFieldsCompleted: kpis.avgFieldsCompleted,
        },
      };

      const summaryPrompt =
        "Owner + business snapshot (JSON):\n" +
        JSON.stringify(payload, null, 2) +
        "\n\nWrite 2–3 short paragraphs describing:\n" +
        "- how complete their listings are\n" +
        "- where they're strongest (locations, categories)\n" +
        "- where there are obvious gaps or risks.\n";

      const summary = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt: summaryPrompt,
      });

      const recsPrompt =
        "Based on this owner data, list 3–6 clear, numbered Next Best Actions.\n\n" +
        "Owner data:\n" +
        JSON.stringify(payload, null, 2);

      const recsRaw = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt: recsPrompt,
      });

      setAiSummary(summary);

      const recs = recsRaw
        .split(/\n\d+[\)\.]\s+/) // handles "1)" or "1."
        .map((x) => x.trim())
        .filter(Boolean)
        .map((chunk) => {
          const lines = chunk.split("\n").map((l) => l.trim());
          return {
            title: lines[0] || "Recommendation",
            detail: lines.slice(1).join(" "),
          };
        });

      setRecommendations(recs);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "AI insights unavailable.");
    } finally {
      setAiSummaryLoading(false);
    }
  }

  // -----------------------------------------------------------
  // AI Chat
  // -----------------------------------------------------------
  async function handleChatSend(e) {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    if (!selectedBusiness) {
      toast("Select a business first.");
      return;
    }
    if (chatCooldown || globalCooldown) {
      toast.error("Please wait a moment before sending another message.");
      return;
    }
    if (!user) {
      toast.error("Not authenticated.");
      return;
    }

    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      setChatLoading(true);
      startCooldown(setChatCooldown, CHAT_COOLDOWN_MS);

      const history = chatMessages
        .map((m) => `${m.role === "user" ? "Owner" : "AI"}: ${m.content}`)
        .join("\n");

      const prompt = `
Business (JSON):
${JSON.stringify(selectedBusiness, null, 2)}

Conversation so far:
${history}

New question from owner:
${question}

Answer in short, practical tips. Mention the business name when helpful.
`;

      const answer = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt,
      });

      setChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "AI chat unavailable.");
    } finally {
      setChatLoading(false);
    }
  }

  // -----------------------------------------------------------
  // SEO Analyzer
  // -----------------------------------------------------------
  async function runSeoAnalyzer() {
    if (!selectedBusiness) {
      toast("Select a business first.");
      return;
    }
    if (seoCooldown || globalCooldown) {
      toast.error("Please wait a moment before running SEO again.");
      return;
    }
    if (!user) {
      toast.error("Not authenticated.");
      return;
    }

    try {
      setSeoLoading(true);
      setSeoResult("");
      startCooldown(setSeoCooldown, TOOL_COOLDOWN_MS);

      const prompt = `
Analyze this business listing for SEO (local search, Google Maps, directory search):

${JSON.stringify(selectedBusiness, null, 2)}

Return:
- Keyword suggestions
- Category / tag ideas
- Suggested title (max 70 chars)
- Suggested one-sentence tagline
Use bullet points where helpful.
`;

      // If your backend doesn't have "seo" mode, keep "advice"
      const result = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt,
      });

      setSeoResult(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "SEO analyzer unavailable.");
    } finally {
      setSeoLoading(false);
    }
  }

  // -----------------------------------------------------------
  // Missing fields detector
  // -----------------------------------------------------------
  async function runMissingFieldsDetector() {
    if (!selectedBusiness) {
      toast("Select a business first.");
      return;
    }
    if (missingCooldown || globalCooldown) {
      toast.error("Please wait a moment before running this again.");
      return;
    }
    if (!user) {
      toast.error("Not authenticated.");
      return;
    }

    try {
      setMissingLoading(true);
      setMissingResult("");
      startCooldown(setMissingCooldown, TOOL_COOLDOWN_MS);

      const prompt = `
Here is the business listing:

${JSON.stringify(selectedBusiness, null, 2)}

1) List which important fields are missing or weak (address, opening hours, photos, website, phone, description details, etc.).
2) For each, suggest concrete content ideas the owner could add.
Use bullet points.
`;

      const result = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt,
      });

      setMissingResult(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Missing fields detector unavailable.");
    } finally {
      setMissingLoading(false);
    }
  }

  // -----------------------------------------------------------
  // Description rewriter
  // -----------------------------------------------------------
  async function runDescriptionRewrite() {
    if (!selectedBusiness) {
      toast("Select a business first.");
      return;
    }

    if (!selectedBusiness.description) {
      toast("Add a description first, then ask AI to rewrite it.");
      return;
    }

    if (rewriteCooldown || globalCooldown) {
      toast.error("Please wait a moment before rewriting again.");
      return;
    }
    if (!user) {
      toast.error("Not authenticated.");
      return;
    }

    try {
      setRewriteLoading(true);
      setRewriteResult("");
      startCooldown(setRewriteCooldown, TOOL_COOLDOWN_MS);

      const prompt = `
Original description:
${selectedBusiness.description}

Business context:
${JSON.stringify(
  {
    name: selectedBusiness.name,
    category: selectedBusiness.category,
    village: selectedBusiness.village,
  },
  null,
  2
)}

Rewrite this description:
- keep it 2–4 short paragraphs
- make it inviting and clear
- avoid buzzwords
- keep the same language (do not translate).
`;

      const result = await safeCallOwnerAI({
        userId: user.id,
        mode: "advice",
        prompt,
      });

      setRewriteResult(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Description rewriter unavailable.");
    } finally {
      setRewriteLoading(false);
    }
  }

  // -----------------------------------------------------------
  // Growth predictions
  // -----------------------------------------------------------
  async function runGrowthPrediction() {
    if (!selectedBusiness) {
      toast("Select a business first.");
      return;
    }
    if (growthCooldown || globalCooldown) {
      toast.error("Please wait a moment before running growth predictions.");
      return;
    }
    if (!user) {
      toast.error("Not authenticated.");
      return;
    }

    try {
      setGrowthLoading(true);
      setGrowthResult("");
      startCooldown(setGrowthCooldown, TOOL_COOLDOWN_MS);

      const prompt = `
Business:
${JSON.stringify(selectedBusiness, null, 2)}

Owner portfolio summary:
${JSON.stringify(
  {
    profileScore,
    totalBusinesses: kpis.totalBusinesses,
    mainCategory: kpis.mainCategory,
    mainVillage: kpis.mainVillage,
  },
  null,
  2
)}

Provide:
- 6–12 month growth outlook (short)
- 3 concrete growth ideas
- 1 risk to watch.
Keep it practical and realistic.
`;

      const result = await safeCallOwnerAI({
        userId: user.id,
        mode: "forecast",
        prompt,
      });

      setGrowthResult(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Growth prediction unavailable.");
    } finally {
      setGrowthLoading(false);
    }
  }

  // -----------------------------------------------------------
  // Global loading (user + subscription + businesses)
  // -----------------------------------------------------------
  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading AI Advisor…
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Build main body (used for both PRO + non-PRO, then overlaid)
  // -----------------------------------------------------------
  let mainBody;

  if (!businesses.length) {
    mainBody = (
      <div className="space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Business Advisor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add a business to unlock AI insights and tools.
            </p>
          </div>
          <button
            onClick={() => navigate("/owner-dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        </header>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            You don&apos;t have any businesses yet.
          </p>
          <button
            onClick={() => navigate("/owner/business/add")}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-700"
          >
            Add your first business
          </button>
        </div>
      </div>
    );
  } else {
    mainBody = (
      <div className="space-y-8">
        {/* Header + business selector */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              AI Business Advisor
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Smart tools to analyze and grow your business.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Business selector – only show dropdown if more than 1 business */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Selected business
              </span>
              {businesses.length > 1 ? (
                <select
                  value={selectedBusinessId || ""}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.village || "Unknown"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {selectedBusiness?.name}{" "}
                  {selectedBusiness?.village ? `— ${selectedBusiness.village}` : ""}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/owner-dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>
          </div>
        </header>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Profile Score"
            value={`${profileScore || 0}%`}
            hint="Average completeness across your listings."
          />
          <KpiCard
            label="Businesses"
            value={kpis.totalBusinesses}
            hint="Active listings in the network."
          />
          <KpiCard
            label="Main Category"
            value={kpis.mainCategory || "N/A"}
            hint="Most frequent category."
          />
          <KpiCard
            label="Strongest Location"
            value={kpis.mainVillage || "N/A"}
            hint="Where you are most present."
          />
        </section>

        {/* Summary + Growth + Recommendations */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* AI Summary */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI Overview
                </h2>
              </div>
              <button
                onClick={fetchOwnerInsights}
                disabled={aiSummaryLoading || summaryCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  className={`h-3 w-3 ${aiSummaryLoading ? "animate-spin" : ""}`}
                />
                {aiSummaryLoading ? "Refreshing…" : "Refresh AI Overview"}
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {aiSummary
                ? aiSummary
                : "No AI summary yet. Click “Refresh AI Overview” to generate one."}
            </div>
          </div>

          {/* Growth Predictions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Growth Predictions
                </h2>
              </div>
              <button
                onClick={runGrowthPrediction}
                disabled={growthLoading || growthCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {growthLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Target className="h-3 w-3" />
                )}
                {growthLoading ? "Generating…" : "Generate"}
              </button>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {growthResult || "Click Generate to see a 6–12 month outlook."}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              AI Recommendations (Next Best Actions)
            </h2>
          </div>

          {recommendations.length ? (
            <ul className="space-y-3 text-sm">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {rec.title}
                  </p>
                  {rec.detail && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {rec.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI will list concrete steps here once the overview has been generated.
            </p>
          )}
        </section>

        {/* Tool grid: Chat, SEO, Missing fields, Rewriter */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* AI Chat */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-sky-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI Chat
                </h2>
              </div>
            </div>

            <div className="mb-3 h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              {chatMessages.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">
                  Ask the AI anything about your business strategy, pricing, marketing, or operations.
                </p>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={idx} className="mb-2">
                    <p className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                      {m.role === "user" ? "You" : "AI"}
                    </p>
                    <p className="text-[12px] whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChatSend} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question about your business…"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={chatLoading || chatCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chatLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Send
              </button>
            </form>
          </div>

          {/* SEO Analyzer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  SEO Analyzer
                </h2>
              </div>
              <button
                onClick={runSeoAnalyzer}
                disabled={seoLoading || seoCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {seoLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Run
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap min-h-[120px]">
              {seoResult ||
                "Click Run to get SEO and keyword suggestions for your selected business."}
            </div>
          </div>

          {/* Missing fields detector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Missing Fields Detector
                </h2>
              </div>
              <button
                onClick={runMissingFieldsDetector}
                disabled={missingLoading || missingCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {missingLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Detect
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap min-h-[120px]">
              {missingResult ||
                "AI will highlight what's missing in your listing and suggest example content."}
            </div>
          </div>

          {/* Description rewriter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-fuchsia-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Description Rewriter
                </h2>
              </div>
              <button
                onClick={runDescriptionRewrite}
                disabled={rewriteLoading || rewriteCooldown || globalCooldown}
                className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rewriteLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Rewrite
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap min-h-[120px]">
              {rewriteResult ||
                "AI will generate a cleaner, more compelling description for your listing."}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Final render with PRO overlay (Option C)
  // -------------------------------------------------------------
  return (
    <div className="relative">
      {/* Blurred + disabled content for non-PRO */}
      <div className={!isPro ? "pointer-events-none blur-sm" : ""}>
        {mainBody}
      </div>

      {/* PRO Upgrade overlay */}
      {!isPro && <ProUpgradeOverlay onUpgrade={() => navigate("/owner/billing")} />}
    </div>
  );
}

// -------------------------------------------------------------
// KPI Card
// -------------------------------------------------------------
function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PRO Upgrade Overlay (Modal-style)
// -------------------------------------------------------------
function ProUpgradeOverlay({ onUpgrade }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/90 px-6 py-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/40">
            <Lock className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              AI features are PRO only
            </h2>
            <p className="text-xs text-slate-400">
              Upgrade to PRO to unlock AI insights, chat, SEO tools, and more.
            </p>
          </div>
        </div>

        <ul className="mb-4 space-y-1 text-xs text-slate-300">
          <li>• AI overview of all your businesses</li>
          <li>• Smart recommendations and next best actions</li>
          <li>• SEO analyzer, description rewriter, and growth forecasts</li>
        </ul>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-black shadow hover:bg-amber-300"
          >
            Upgrade to PRO
          </button>
        </div>
      </div>
    </div>
  );
}
