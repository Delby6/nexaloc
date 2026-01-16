// server/routes/ai.js
import express from "express";
import OpenAI from "openai";

import { requireProUser } from "../middleware/requireProUser.js";
import { requireOperatorOrPro } from "../middleware/requireOperatorOrPro.js";

const router = express.Router();

/* -------------------------------------------------------
   OpenAI client (server-side)
------------------------------------------------------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function roleBadge(req) {
  if (req.isAdmin) return "ADMIN";
  if (req.isOperator) return "OPERATOR";
  return "PRO";
}

async function runLLM({ prompt, mode }) {
  // mode is optional, but lets you tune system instructions
  const systemByMode = {
    forecast:
      "You are an AI reliability forecasting assistant. Be concise. Provide risks + preventive actions.",
    advice:
      "You are an AI strategy advisor for a local business ecosystem. Be concise and actionable.",
    logs:
      "You are an AI log analysis assistant. Identify patterns, anomalies, and a prioritized action list.",
    anomaly:
      "You are an AI anomaly detection assistant. Short bullet points: what’s abnormal, likely root causes, immediate actions.",
    default:
      "You are an AI operations analyst. Be concise and actionable.",
  };

  const system = systemByMode[mode] || systemByMode.default;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No AI response.";
}

/* -------------------------------------------------------
   OPERATOR AI — Admin/Operator bypass OR PRO
   POST /api/ai/operator/generate
   Body: { userId, prompt, mode? }
------------------------------------------------------- */
router.post("/operator/generate", requireOperatorOrPro, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on backend" });
    }

    const { prompt, mode } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Prevent accidental huge payloads from crashing your token usage
    if (prompt.length > 40_000) {
      return res.status(413).json({
        error: "Prompt too large",
        message: "Reduce logs/data size before sending to AI.",
      });
    }

    const output = await runLLM({ prompt, mode });

    return res.json({
      ok: true,
      output,
      meta: { access: roleBadge(req), mode: mode || "default" },
    });
  } catch (err) {
  console.error("AI operator generate error:", err);

  // Surface OpenAI errors cleanly to frontend
  const status = err?.status || err?.response?.status || 500;
  const message =
    err?.error?.message ||
    err?.message ||
    "AI generation failed";

  return res.status(status).json({
    error: message,
    code: err?.code || err?.error?.code || null,
    type: err?.type || err?.error?.type || null,
  });
}

});

/* -------------------------------------------------------
   OWNER AI — PRO ONLY
   POST /api/ai/owner/generate
   Body: { userId, prompt, mode? }
------------------------------------------------------- */
router.post("/owner/generate", requireProUser, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on backend" });
    }

    const { prompt, mode } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    if (prompt.length > 40_000) {
      return res.status(413).json({
        error: "Prompt too large",
        message: "Reduce logs/data size before sending to AI.",
      });
    }

    const output = await runLLM({ prompt, mode });

    return res.json({
      ok: true,
      output,
      meta: { access: "PRO", mode: mode || "default" },
    });
  } catch (err) {
    console.error("AI owner generate error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
});

export default router;
