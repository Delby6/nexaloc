import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

export default function OperatorAnalytics({ businesses }) {
  const { theme } = useTheme() || { theme: "dark" };

  if (!businesses.length)
    return (
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        Not enough business data to compute analytics.
      </p>
    );

  /* ------------------------------------------------------------------
     COMPUTE ANALYTICS
  ------------------------------------------------------------------ */

  // Category counts
  const categoryCounts = {};
  // Village counts
  const villageCounts = {};
  // Trend data by month
  const trendCounts = {};

  businesses.forEach((b) => {
    // Category
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;

    // Villages
    villageCounts[b.village] = (villageCounts[b.village] || 0) + 1;

    // Trend data (group by "YYYY-MM")
    const month = b.created_at?.split("T")[0].slice(0, 7);
    if (month) {
      trendCounts[month] = (trendCounts[month] || 0) + 1;
    }
  });

  // Convert for charts
  const categoryData = Object.entries(categoryCounts).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const villageData = Object.entries(villageCounts).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const trendData = Object.entries(trendCounts)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, count]) => ({
      month,
      count,
    }));

  // Heatmap
  const heatmapData = Object.entries(villageCounts).map(([v, count]) => ({
    village: v,
    intensity: count,
  }));

  // Theme-aware colors
  const isDark = theme === "dark";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const labelColor = isDark ? "#e2e8f0" : "#0f172a";
  const barColor = isDark ? "#38bdf8" : "#0ea5e9";
  const lineColor = isDark ? "#38bdf8" : "#0ea5e9";

  const COLORS = isDark
    ? ["#38bdf8", "#818cf8", "#f472b6", "#facc15", "#4ade80", "#fb923c"]
    : ["#0284c7", "#6366f1", "#ec4899", "#eab308", "#22c55e", "#f97316"];

  /* ------------------------------------------------------------------
     RENDER SECTION
  ------------------------------------------------------------------ */

  return (
    <div className="space-y-10 mt-10">
      {/* -------------------------------------------------------------- */}
      {/* 1. CATEGORY DISTRIBUTION */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Category Distribution
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#020617" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                color: labelColor,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* 2. VILLAGE DISTRIBUTION PIE CHART */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Village Activity
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={villageData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label
            >
              {villageData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#020617" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                color: labelColor,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* 3. HEATMAP (Village -> Intensity) */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Business Density Heatmap
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {heatmapData.map((item) => (
            <div
              key={item.village}
              className="p-4 rounded-lg text-center text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              style={{
                background: isDark
                  ? `rgba(56, 189, 248, ${0.15 + item.intensity * 0.08})`
                  : `rgba(56, 189, 248, ${0.08 + item.intensity * 0.05})`,
              }}
            >
              {item.village}
              <div className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                {item.intensity} businesses
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* 4. TRENDS OVER TIME */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Business Growth Trend
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <XAxis dataKey="month" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#020617" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                color: labelColor,
                fontSize: 12,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke={lineColor}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* 5. TOP VILLAGES */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Top Villages
        </h3>

        <ul className="space-y-2 text-sm">
          {villageData
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((v) => (
              <li
                key={v.name}
                className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-700 dark:text-slate-300"
              >
                <span>{v.name}</span>
                <span className="text-sky-600 dark:text-sky-300 font-medium">
                  {v.value}
                </span>
              </li>
            ))}
        </ul>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* 6. TOP CATEGORIES */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Top Categories
        </h3>

        <ul className="space-y-2 text-sm">
          {categoryData
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((c) => (
              <li
                key={c.name}
                className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-700 dark:text-slate-300"
              >
                <span>{c.name}</span>
                <span className="text-purple-600 dark:text-purple-300 font-medium">
                  {c.value}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
