// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "crypto";

import cookieRoutes from "./routes/cookies.js";
import billingRoutes from "./routes/billing.js";
import stripeWebhookRoutes from "./routes/stripeWebhook.js";
import transcribeRoute from "./routes/transcribe.js";
import aiRoutes from "./routes/ai.js";
import adminBillingRouter from "./routes/adminBilling.js";


import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env"), override: true });


console.log("Loaded SUPABASE URL:", process.env.SUPABASE_URL);
console.log(
  "Loaded SERVICE ROLE KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + "..."
);

const app = express();


/* ---------------------------------------------------------
   CORS — LOCAL + PRODUCTION (Render/Vercel)
--------------------------------------------------------- */

// Comma-separated list from Render env var, e.g.
// "http://localhost:5173,https://nexaloc.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.set("trust proxy", 1); // important behind Render proxy

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Render health checks, server-to-server)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
console.log("CORS_ORIGINS raw:", process.env.CORS_ORIGINS);
console.log("Allowed origins parsed:", allowedOrigins);



/* ---------------------------------------------------------
   Stripe Webhooks BEFORE express.json (raw body)
--------------------------------------------------------- */
app.use("/webhooks", stripeWebhookRoutes);

/* ---------------------------------------------------------
   JSON parser AFTER webhooks
--------------------------------------------------------- */
app.use(express.json());

/* ---------------------------------------------------------
   Simple logError stub so your existing calls don't crash
--------------------------------------------------------- */
async function logError(payload) {
  console.error("[LOG ERROR]", payload);
}

/* ---------------------------------------------------------
   API ROUTES
--------------------------------------------------------- */
app.use("/api/cookies", cookieRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api", transcribeRoute);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminBillingRouter);

/* ---------------------------------------------------------
   System Health
--------------------------------------------------------- */
app.get("/api/ai/ping", (req, res) => {
  res.json({
    ok: true,
    message: "AI server is running",
    time: new Date().toISOString(),
  });
});

/* ---------------------------------------------------------
   Example /pay route (kept, but safe)
--------------------------------------------------------- */
app.post("/pay", async (req, res) => {
  try {
    // ... your payment logic ...
    res.json({ ok: true });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);

    await logError({
      service: "payment-service",
      message: err.message,
      meta: { stack: err.stack },
    });

    res.status(500).json({ error: "Payment failed" });
  }
});

/* ---------------------------------------------------------
   OpenAI client + helpers
--------------------------------------------------------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let aiCache = {
  lastHash: null,
  lastResult: null,
  timestamp: null,
};

function hashBusinesses(businesses) {
  const dataString = JSON.stringify(
    businesses.map((b) => ({
      name: b.name,
      category: b.category,
      village: b.village,
      description: b.description,
    }))
  );

  return crypto.createHash("sha256").update(dataString).digest("hex");
}

function computeTop(businesses, field) {
  const counts = {};
  for (const b of businesses) {
    if (!b[field]) continue;
    counts[b[field]] = (counts[b[field]] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/* ---------------------------------------------------------
   AI Insights
--------------------------------------------------------- */
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { businesses } = req.body;

    if (!businesses || businesses.length === 0) {
      return res.status(400).json({ error: "No businesses provided." });
    }

    const currentHash = hashBusinesses(businesses);

    // 24h cache
    if (
      aiCache.lastHash === currentHash &&
      Date.now() - aiCache.timestamp < 24 * 60 * 60 * 1000
    ) {
      return res.json({ insights: aiCache.lastResult });
    }

    const topCategory = computeTop(businesses, "category");
    const topVillage = computeTop(businesses, "village");

    const prompt = `
You are an enterprise business intelligence assistant...
${JSON.stringify(businesses, null, 2)}
    `;

    let aiResponse;
    try {
      aiResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are a business analyst." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });
    } catch (err) {
      console.error("OpenAI error:", err);

      await logError({
        service: "openai",
        message: err.message,
        meta: { stack: err.stack },
      });

      const fallback = `AI service offline...`;

      aiCache = {
        lastHash: currentHash,
        lastResult: fallback,
        timestamp: Date.now(),
      };

      return res.json({ insights: fallback });
    }

    const insights =
      aiResponse.choices[0]?.message?.content || "No insights generated.";

    aiCache = {
      lastHash: currentHash,
      lastResult: insights,
      timestamp: Date.now(),
    };

    res.json({ insights });
  } catch (error) {
    console.error("AI Insights Fatal Error:", error);

    await logError({
      service: "ai-insights",
      message: error.message,
      meta: { stack: error.stack },
    });

    res.json({
      insights: "AI insights unavailable. Try again later.",
    });
  }
});

/* ---------------------------------------------------------
   Start Server
--------------------------------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
