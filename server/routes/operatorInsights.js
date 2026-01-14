import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/operator/insights", async (req, res) => {
  try {
    const summary = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst for a local business marketplace operator. " +
            "Given aggregated metrics, produce a concise, operator-friendly summary. " +
            "Highlight growth trends, risks, anomalies, and actionable suggestions."
        },
        {
          role: "user",
          content:
            "Here is the current state of the network (JSON):\n\n" +
            JSON.stringify(summary, null, 2)
        }
      ]
    });

    res.json({
      insight: completion.choices[0].message.content.trim()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

export default router;
