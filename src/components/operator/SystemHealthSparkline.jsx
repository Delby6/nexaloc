// src/components/operator/SystemHealthSparkline.jsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SystemHealthSparkline({ data = [] }) {
  const chartData = (data || []).map((point, index) => ({
    idx: index,
    ms: point?.ms ?? 0,
    ok: point?.ok ?? false,
    // short label to avoid clutter
    label: new Date(point.time || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  }));

  if (!chartData.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No latency data yet…
      </p>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: "#1f2937",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value) => [`${value} ms`, "Latency"]}
          />
          <Area
            type="monotone"
            dataKey="ms"
            stroke="#0EA5E9"
            strokeWidth={2}
            fill="url(#sparkline-gradient)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
