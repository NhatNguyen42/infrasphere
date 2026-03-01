"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
  BarChart, Bar,
} from "recharts";

import type { ForecastResult } from "@/lib/api";
import { fetchAllForecasts } from "@/lib/api";
import BentoCard from "@/components/BentoCard";

const REGION_COLORS: Record<string, string> = {
  PJM: "#3b82f6",
  ERCOT: "#f97316",
  CAISO: "#10b981",
  MISO: "#8b5cf6",
};

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [activeRegion, setActiveRegion] = useState("PJM");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllForecasts(7)
      .then(setForecasts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 animate-pulse">
        Loading forecasts...
      </div>
    );
  }

  const active = forecasts.find((f) => f.region_id === activeRegion);
  const allPoints = active
    ? [
        ...active.historical.map((p) => ({ ...p, type: "historical" })),
        ...active.forecast.map((p) => ({ ...p, type: "forecast" })),
      ]
    : [];

  // Capacity gap comparison across regions (final forecast year)
  const gapData = forecasts.map((f) => {
    const lastForecast = f.forecast[f.forecast.length - 1];
    return {
      region: f.region_id,
      total_demand: lastForecast?.total_demand_gw || 0,
      ai_demand: lastForecast?.ai_demand_gw || 0,
      capacity_gap: lastForecast?.capacity_gap_gw || 0,
    };
  });

  // AI demand across all regions over time (combined chart)
  const combinedYears = new Set<number>();
  forecasts.forEach((f) => {
    f.historical.forEach((p) => combinedYears.add(p.year));
    f.forecast.forEach((p) => combinedYears.add(p.year));
  });
  const aiTrendData = Array.from(combinedYears)
    .sort()
    .map((year) => {
      const row: Record<string, number> = { year };
      forecasts.forEach((f) => {
        const point =
          f.historical.find((p) => p.year === year) ||
          f.forecast.find((p) => p.year === year);
        row[f.region_id] = point?.ai_demand_gw || 0;
      });
      return row;
    });

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Power Demand Forecasts</h1>
        <p className="text-sm text-slate-400 mt-1">
          AI infrastructure power demand projections by region (2020–2033)
        </p>
      </div>

      {/* Region tabs */}
      <div className="flex gap-2">
        {forecasts.map((f) => (
          <button
            key={f.region_id}
            onClick={() => setActiveRegion(f.region_id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeRegion === f.region_id
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {f.region_id}
          </button>
        ))}
      </div>

      {/* Main forecast chart */}
      {active && (
        <BentoCard
          title={`${active.region_name} — Total Power Demand`}
          subtitle="Historical + forecast with confidence bands (GW)"
          glow="blue"
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={allPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{ value: "GW", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)} GW`,
                  name,
                ]}
              />
              {/* Confidence band */}
              <Area
                dataKey="confidence_upper"
                stroke="none"
                fill="url(#gradConfidence)"
                name="Upper Bound"
              />
              <Area
                dataKey="confidence_lower"
                stroke="none"
                fill="transparent"
                name="Lower Bound"
              />
              {/* Total demand */}
              <Area
                dataKey="total_demand_gw"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradTotal)"
                name="Total Demand"
                dot={false}
              />
              {/* AI demand */}
              <Area
                dataKey="ai_demand_gw"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#gradAI)"
                name="AI Demand"
                dot={false}
              />
              {/* Renewable supply */}
              <Area
                dataKey="renewable_supply_gw"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                name="Renewable Supply"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </BentoCard>
      )}

      {/* Second row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Demand across all regions */}
        <BentoCard
          title="AI Power Demand by Region"
          subtitle="All tracked regions (GW)"
          glow="orange"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={aiTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="year"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number) => [`${value.toFixed(1)} GW`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
              />
              {forecasts.map((f) => (
                <Line
                  key={f.region_id}
                  dataKey={f.region_id}
                  stroke={REGION_COLORS[f.region_id] || "#6b7280"}
                  strokeWidth={2}
                  dot={false}
                  name={f.region_id}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Capacity Gap by region (final year) */}
        <BentoCard
          title="Projected Demand (Final Year)"
          subtitle="Total demand vs AI demand (GW)"
          glow="green"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gapData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="region"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} GW`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total_demand" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Total Demand" />
              <Bar dataKey="ai_demand" fill="#f97316" radius={[3, 3, 0, 0]} name="AI Demand" />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>
      </div>

      {/* Detailed forecast table */}
      {active && (
        <BentoCard title={`${active.region_id} Forecast Details`} subtitle="Year-by-year projections">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Year", "Total (GW)", "AI (GW)", "Renewable (GW)", "Gap (GW)", "Lower Bound", "Upper Bound"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {allPoints.map((p) => (
                  <tr
                    key={p.year}
                    className={`border-b border-white/[0.03] ${
                      p.type === "forecast" ? "bg-blue-500/[0.03]" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 font-mono font-semibold">
                      {p.year}
                      {p.type === "forecast" && (
                        <span className="text-[9px] text-blue-400 ml-1">F</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-mono">{p.total_demand_gw.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono text-orange-400">
                      {p.ai_demand_gw.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-emerald-400">
                      {p.renewable_supply_gw.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 font-mono">
                      <span className={p.capacity_gap_gw > 0 ? "text-red-400" : "text-slate-400"}>
                        {p.capacity_gap_gw.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-slate-500">{p.confidence_lower.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-500">{p.confidence_upper.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}
    </div>
  );
}
