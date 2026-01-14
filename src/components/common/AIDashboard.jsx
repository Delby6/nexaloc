import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, ShoppingCart, Star, Loader2 } from "lucide-react";

export default function AIDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  // ✅ Fetch businesses from Supabase
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBusinesses(data || []);
      } catch (err) {
        console.error("Error loading businesses:", err.message);
      }
    }
    fetchBusinesses();
  }, []);

  // ✅ Local “AI” logic (no GPT calls)
  async function generateAIInsights() {
    try {
      setAiLoading(true);
      setAiInsights("");

      const byCategory = businesses.reduce((acc, b) => {
        acc[b.category] = (acc[b.category] || 0) + 1;
        return acc;
      }, {});
      const byVillage = businesses.reduce((acc, b) => {
        acc[b.village] = (acc[b.village] || 0) + 1;
        return acc;
      }, {});
      const topCategory =
        Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
      const topVillage =
        Object.entries(byVillage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

      await new Promise((r) => setTimeout(r, 600));

      setAiInsights(
        `There are ${businesses.length} businesses listed. The most common category is ${topCategory}. The local with the most listings is ${topVillage}.`
      );

      setRecommendations([
        {
          name: `Expand ${topCategory || "popular"} services`,
          reason: `Since ${topCategory} is the leading category, creating supporting or complementary services could increase local value.`,
        },
        {
          name: `${topVillage || "Local"} Tourism Boost`,
          reason: `Promoting small businesses in ${topVillage} can strengthen local community branding and tourism.`,
        },
        {
          name: `Digital Training & E-commerce`,
          reason: `Helping businesses sell online can empower ${topVillage} and similar areas.`,
        },
      ]);
    } catch (err) {
      console.error("AI summary generation failed:", err);
      setAiInsights("Error generating insights.");
    } finally {
      setAiLoading(false);
    }
  }

  // ✅ Charts data
  const analytics = useMemo(() => {
    const byCategory = {};
    const byVillage = {};
    businesses.forEach((b) => {
      byCategory[b.category] = (byCategory[b.category] || 0) + 1;
      byVillage[b.village] = (byVillage[b.village] || 0) + 1;
    });
    return { byCategory, byVillage };
  }, [businesses]);

  const categoryData = Object.entries(analytics.byCategory).map(
    ([name, count]) => ({ name, count })
  );
  const villageData = Object.entries(analytics.byVillage).map(
    ([name, count]) => ({ name, count })
  );
  const colors = ["#38bdf8", "#818cf8", "#facc15", "#f87171", "#34d399"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 shadow border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="text-sky-600 dark:text-sky-400" /> AI
          Business Dashboard
        </h2>

        {/* --- Charts --- */}
        {businesses.length === 0 ? (
          <p className="text-slate-500">Loading analytics...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-inner">
              <h3 className="font-semibold mb-3 text-sky-500">
                Top Categories
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-inner">
              <h3 className="font-semibold mb-3 text-sky-500">Top Villages</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={villageData.slice(0, 5)}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- Local “AI Insights” --- */}
        <div className="bg-gradient-to-r from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 mb-8 shadow-inner">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Sparkles className="text-yellow-400" /> AI-Powered Insights
          </h3>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Generating...
            </div>
          ) : aiInsights ? (
            <p>{aiInsights}</p>
          ) : (
            <button
              onClick={generateAIInsights}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              Generate AI Insights
            </button>
          )}
        </div>

        {/* --- Static Local Recommendations --- */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 shadow-inner">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Star className="text-yellow-500" /> AI Business Recommendations
            </h3>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="border-l-4 border-yellow-500 pl-3 text-sm"
                >
                  <strong>{rec.name}</strong> — {rec.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>
    </div>
  );
}
