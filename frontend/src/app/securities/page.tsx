"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { Search, ArrowUpDown, BarChart3 } from "lucide-react";

import type { Security, SectorBreakdown, HeatmapCell } from "@/lib/api";
import {
  fetchSecurities, fetchSectors, fetchHeatmap, fetchPowerSensitivity,
} from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";

// ---------------------------------------------------------------------------
// Heatmap Grid
// ---------------------------------------------------------------------------
function HeatmapGrid({ cells }: { cells: HeatmapCell[] }) {
  const maxCap = Math.max(...cells.map((c) => c.market_cap_bn), 1);
  const maxYtd = Math.max(...cells.map((c) => Math.abs(c.ytd_return)), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {cells
        .sort((a, b) => b.market_cap_bn - a.market_cap_bn)
        .slice(0, 30)
        .map((c, i) => {
          const sizeRatio = Math.max(c.market_cap_bn / maxCap, 0.15);
          const width = Math.max(52, 120 * sizeRatio);
          const ytdNorm = c.ytd_return / maxYtd;
          const r = ytdNorm < 0 ? 200 + Math.abs(ytdNorm) * 55 : 30;
          const g = ytdNorm > 0 ? 140 + ytdNorm * 80 : 30;
          const b = 60;
          return (
            <motion.div
              key={c.ticker}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              className="rounded-xl flex flex-col items-center justify-center text-center p-1.5 border border-white/[0.06] cursor-default hover:border-white/20 hover:scale-105 transition-all duration-200"
              style={{
                width,
                height: Math.max(40, width * 0.55),
                background: `linear-gradient(135deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.15))`,
              }}
              title={`${c.name}\nYTD: ${c.ytd_return > 0 ? "+" : ""}${c.ytd_return}%\nMCap: $${c.market_cap_bn}B`}
            >
              <span className="text-[10px] font-mono font-bold text-white/90">
                {c.ticker}
              </span>
              <span className={`text-[9px] font-mono font-bold ${c.ytd_return >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {c.ytd_return > 0 ? "+" : ""}{c.ytd_return.toFixed(0)}%
              </span>
            </motion.div>
          );
        })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Securities Page
// ---------------------------------------------------------------------------
export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [sectors, setSectors] = useState<SectorBreakdown[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [powerSens, setPowerSens] = useState<
    { ticker: string; name: string; category: string; power_demand_sensitivity: number; ytd_return: number; ai_infra_revenue_pct: number; market_cap_bn: number }[]
  >([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<keyof Security>("market_cap_bn");
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSecurities(), fetchSectors(), fetchHeatmap(), fetchPowerSensitivity()])
      .then(([s, sec, h, p]) => {
        setSecurities(s);
        setSectors(sec);
        setHeatmap(h);
        setPowerSens(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let data = [...securities];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (category) data = data.filter((s) => s.category === category);
    data.sort((a, b) => {
      const av = (a[sortBy] as number) ?? 0;
      const bv = (b[sortBy] as number) ?? 0;
      return sortDesc ? bv - av : av - bv;
    });
    return data;
  }, [securities, search, category, sortBy, sortDesc]);

  const toggleSort = (col: keyof Security) => {
    if (sortBy === col) setSortDesc(!sortDesc);
    else { setSortBy(col); setSortDesc(true); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <span className="font-medium">Loading securities...</span>
        </motion.div>
      </div>
    );
  }

  const PIE_COLORS = Object.values(CATEGORY_COLORS);
  const tooltipStyle = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Infrastructure Securities</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          40 equities &amp; ETFs across the AI infrastructure value chain
        </p>
      </motion.div>

      {/* Heatmap */}
      <BentoCard title="Market Heatmap" subtitle="Size = Market Cap · Colour = YTD Return" glow="blue" delay={1}>
        <HeatmapGrid cells={heatmap} />
      </BentoCard>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <BentoCard title="Sector Breakdown" subtitle="Market cap by category" glow="purple" delay={2}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sectors}
                dataKey="total_market_cap_bn"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={2}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                style={{ fontSize: 9 }}
              >
                {sectors.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard title="Power Sensitivity vs Return" subtitle="Bubble = AI revenue %" glow="green" delay={3}>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="power_demand_sensitivity" name="Power Sens." tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="ytd_return" name="YTD %" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  name === "YTD %" ? `${value}%` : value.toFixed(2), name,
                ]}
              />
              <Scatter data={powerSens} fill="#3b82f6">
                {powerSens.map((d, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[d.category] || "#3b82f6"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard title="Avg YTD Return by Sector" subtitle="Category performance" glow="orange" delay={4}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectors.sort((a, b) => b.avg_ytd_return - a.avg_ytd_return)} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, "Avg YTD"]} />
              <Bar dataKey="avg_ytd_return" radius={[0, 6, 6, 0]}>
                {sectors.map((s, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[s.category] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>
      </div>

      {/* Filter bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
        >
          <option value="">All Categories</option>
          {sectors.map((s) => (
            <option key={s.category} value={s.category}>{s.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <BarChart3 size={13} />
          <span>{filtered.length} securities</span>
        </div>
      </motion.div>

      {/* Securities Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card overflow-x-auto glow-blue">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {[
                { key: "ticker" as keyof Security, label: "Ticker" },
                { key: "name" as keyof Security, label: "Name" },
                { key: "category" as keyof Security, label: "Category" },
                { key: "price" as keyof Security, label: "Price" },
                { key: "market_cap_bn" as keyof Security, label: "MCap $B" },
                { key: "ytd_return" as keyof Security, label: "YTD %" },
                { key: "ai_infra_revenue_pct" as keyof Security, label: "AI Rev %" },
                { key: "power_demand_sensitivity" as keyof Security, label: "Pwr Sens" },
                { key: "esg_score" as keyof Security, label: "ESG" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 cursor-pointer hover:text-white select-none uppercase tracking-wider"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && <ArrowUpDown className="w-3 h-3 text-blue-400" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <motion.tr
                key={s.ticker}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="border-b border-white/[0.03] table-row-hover"
              >
                <td className="px-4 py-2.5 font-mono font-bold text-white">{s.ticker}</td>
                <td className="px-4 py-2.5 text-slate-300">{s.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="tag-pill"
                    style={{
                      background: `${CATEGORY_COLORS[s.category] || "#6b7280"}15`,
                      color: CATEGORY_COLORS[s.category] || "#6b7280",
                      border: `1px solid ${CATEGORY_COLORS[s.category] || "#6b7280"}30`,
                    }}
                  >
                    {s.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono">${s.price.toFixed(0)}</td>
                <td className="px-4 py-2.5 font-mono">{s.market_cap_bn.toFixed(0)}</td>
                <td className={`px-4 py-2.5 font-mono font-bold ${s.ytd_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {s.ytd_return > 0 ? "+" : ""}{s.ytd_return.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 font-mono">{s.ai_infra_revenue_pct}%</td>
                <td className="px-4 py-2.5 font-mono">{s.power_demand_sensitivity.toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.esg_score}%`, background: s.esg_score > 70 ? "#10b981" : s.esg_score > 50 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="font-mono text-xs">{s.esg_score}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
