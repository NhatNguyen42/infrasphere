"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
  BarChart, Bar,
} from "recharts";
import { TrendingUp } from "lucide-react";

import type { ForecastResult } from "@/lib/api";
import { fetchAllForecasts } from "@/lib/api";
import BentoCard from "@/components/BentoCard";

const REGION_COLORS: Record<string, string> = {
  PJM: "#3b82f6",
  ERCOT: "#f97316",
  CAISO: "#10b981",
  MISO: "#8b5cf6",
};

const REGION_BG: Record<string, string> = {
  PJM: "rgba(59,130,246,0.08)",
  ERCOT: "rgba(249,115,22,0.08)",
  CAISO: "rgba(16,185,129,0.08)",
  MISO: "rgba(139,92,246,0.08)",
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
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <span className="font-medium">Loading forecasts...</span>
        </motion.div>
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

  const gapData = forecasts.map((f) => {
    const lastForecast = f.forecast[f.forecast.length - 1];
    return {
      region: f.region_id,
      total_demand: lastForecast?.total_demand_gw || 0,
      ai_demand: lastForecast?.ai_demand_gw || 0,
      capacity_gap: lastForecast?.capacity_gap_gw || 0,
    };
  });

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

  const tooltipStyle = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 };

  return (
    <div className="max-w-[min(1600px,92vw)] mx-auto px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Power Demand Forecasts</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          AI infrastructure power demand projections by region (2020–2033)
        </p>
      </motion.div>

      {/* Region tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-2">
        {forecasts.map((f, i) => {
          const isActive = activeRegion === f.region_id;
          const color = REGION_COLORS[f.region_id] || "#6b7280";
          return (
            <motion.button
              key={f.region_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => setActiveRegion(f.region_id)}
              className="relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200"
              style={{
                background: isActive ? `${color}20` : "rgba(255,255,255,0.03)",
                color: isActive ? color : "#94a3b8",
                border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? `0 0 20px ${color}15` : "none",
              }}
            >
              {isActive && (
                <motion.div layoutId="regionIndicator" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full mx-3"
                  style={{ background: color }} />
              )}
              {f.region_id}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Main forecast chart */}
      {active && (
        <BentoCard
          title={`${active.region_name} — Total Power Demand`}
          subtitle="Historical + forecast with confidence bands (GW)"
          glow="blue"
          delay={1}
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={allPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#475569" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#475569" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: "GW", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value.toFixed(1)} GW`, name]} />
              <Area dataKey="confidence_upper" stroke="none" fill="url(#gradConfidence)" name="Upper Bound" />
              <Area dataKey="confidence_lower" stroke="none" fill="transparent" name="Lower Bound" />
              <Area dataKey="total_demand_gw" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradTotal)" name="Total Demand" dot={false} />
              <Area dataKey="ai_demand_gw" stroke="#f97316" strokeWidth={2.5} fill="url(#gradAI)" name="AI Demand" dot={false} />
              <Area dataKey="renewable_supply_gw" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Renewable Supply" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </BentoCard>
      )}

      {/* Second row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BentoCard title="AI Power Demand by Region" subtitle="All tracked regions (GW)" glow="orange" delay={2}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={aiTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} GW`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {forecasts.map((f) => (
                <Line key={f.region_id} dataKey={f.region_id}
                  stroke={REGION_COLORS[f.region_id] || "#6b7280"} strokeWidth={2.5} dot={false} name={f.region_id} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard title="Projected Demand (Final Year)" subtitle="Total demand vs AI demand (GW)" glow="green" delay={3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gapData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBarTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="gradBarAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <XAxis dataKey="region" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value.toFixed(1)} GW`, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total_demand" fill="url(#gradBarTotal)" radius={[6, 6, 0, 0]} name="Total Demand" />
              <Bar dataKey="ai_demand" fill="url(#gradBarAI)" radius={[6, 6, 0, 0]} name="AI Demand" />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>
      </div>

      {/* Detailed forecast table */}
      {active && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <BentoCard title={`${active.region_id} Forecast Details`} subtitle="Year-by-year projections" glow="cyan" delay={4}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Year", "Total (GW)", "AI (GW)", "Renewable (GW)", "Gap (GW)", "Lower Bound", "Upper Bound"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allPoints.map((p, i) => (
                    <motion.tr
                      key={p.year}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-white/[0.03] table-row-hover ${
                        p.type === "forecast" ? "bg-blue-500/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-mono font-bold text-white">
                        {p.year}
                        {p.type === "forecast" && (
                          <span className="tag-pill text-[8px] ml-2 py-0 px-1.5" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }}>
                            F
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono">{p.total_demand_gw.toFixed(1)}</td>
                      <td className="px-4 py-2 font-mono text-orange-400 font-bold">{p.ai_demand_gw.toFixed(1)}</td>
                      <td className="px-4 py-2 font-mono text-emerald-400">{p.renewable_supply_gw.toFixed(1)}</td>
                      <td className="px-4 py-2 font-mono">
                        <span className={p.capacity_gap_gw > 0 ? "text-red-400 font-bold" : "text-slate-400"}>
                          {p.capacity_gap_gw.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-500">{p.confidence_lower.toFixed(1)}</td>
                      <td className="px-4 py-2 font-mono text-slate-500">{p.confidence_upper.toFixed(1)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </motion.div>
      )}
    </div>
  );
}
