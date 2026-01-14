// -------------------------------------------------------------
// owner-ai-insights Edge Function (NO OpenAI SDK)
// Fully JavaScript-compatible even inside index.ts
// -------------------------------------------------------------

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const prompt = `
You are the AI Business Advisor.
Analyze the owner’s business data and return:

1. A 4-sentence summary.
2. A list of 3 actionable recommendations.

DATA:
${JSON.stringify(body, null, 2)}
`;

    // 🔥 RAW HTTPS CALL — NO SDK NEEDED
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      throw new Error(data.error?.message || "OpenAI call failed.");
    }

    const text = data.choices?.[0]?.message?.content || "";
    const parts = text.split("RECOMMENDATIONS:");

    const summary = parts[0]?.trim() || "";
    const recText = parts[1] || "";

    const recommendations = recText
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x !== "")
      .slice(0, 3)
      .map((line) => ({
        title: line.replace(/^\d+\.\s*/, ""),
        detail: line,
      }));

    return new Response(
      JSON.stringify({ summary, recommendations }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("EDGE ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
