"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { Search, Filter, ArrowUpDown } from "lucide-react";

import type { Security, SectorBreakdown, HeatmapCell } from "@/lib/api";
import {
  fetchSecurities, fetchSectors, fetchHeatmap, fetchPowerSensitivity,
} from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";

// ---------------------------------------------------------------------------
// Treemap-ish Heatmap (using simple divs instead of a heavy lib)
// ---------------------------------------------------------------------------
function HeatmapGrid({ cells }: { cells: HeatmapCell[] }) {
  const maxCap = Math.max(...cells.map((c) => c.market_cap_bn), 1);
  const maxYtd = Math.max(...cells.map((c) => Math.abs(c.ytd_return)), 1);

  return (
    <div className="flex flex-wrap gap-1">
      {cells
        .sort((a, b) => b.market_cap_bn - a.market_cap_bn)
        .slice(0, 30)
        .map((c) => {
          const sizeRatio = Math.max(c.market_cap_bn / maxCap, 0.15);
          const width = Math.max(48, 120 * sizeRatio);
          const ytdNorm = c.ytd_return / maxYtd;
          const r = ytdNorm < 0 ? 200 + Math.abs(ytdNorm) * 55 : 40;
          const g = ytdNorm > 0 ? 140 + ytdNorm * 80 : 40;
          const b = 60;
          return (
            <div
              key={c.ticker}
              className="rounded-lg flex flex-col items-center justify-center text-center p-1 border border-white/5 cursor-default"
              style={{
                width,
                height: Math.max(36, width * 0.55),
                background: `rgba(${r},${g},${b},0.35)`,
              }}
              title={`${c.name}\nYTD: ${c.ytd_return > 0 ? "+" : ""}${c.ytd_return}%\nMCap: $${c.market_cap_bn}B`}
            >
              <span className="text-[10px] font-mono font-bold text-white/90">
                {c.ticker}
              </span>
              <span
                className={`text-[9px] font-mono ${
                  c.ytd_return >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {c.ytd_return > 0 ? "+" : ""}
                {c.ytd_return.toFixed(0)}%
              </span>
            </div>
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

  // Client-side filter/sort
  const filtered = useMemo(() => {
    let data = [...securities];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
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
      <div className="flex items-center justify-center h-[60vh] text-slate-400 animate-pulse">
        Loading securities...
      </div>
    );
  }

  const PIE_COLORS = Object.values(CATEGORY_COLORS);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Infrastructure Securities</h1>
        <p className="text-sm text-slate-400 mt-1">
          40 equities & ETFs across the AI infrastructure value chain
        </p>
      </div>

      {/* Heatmap */}
      <BentoCard title="Market Heatmap" subtitle="Size = Market Cap · Colour = YTD Return" glow="blue">
        <HeatmapGrid cells={heatmap} />
      </BentoCard>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sector Breakdown Pie */}
        <BentoCard title="Sector Breakdown" subtitle="Market cap by category">
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
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Power Sensitivity Scatter */}
        <BentoCard title="Power Sensitivity vs Return" subtitle="Bubble = AI revenue %" glow="green">
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="power_demand_sensitivity"
                name="Power Sens."
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="ytd_return"
                name="YTD %"
                tick={{ fill: "#64748b", fontSize: 10 }}
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
                formatter={(value: number, name: string) => [
                  name === "YTD %" ? `${value}%` : value.toFixed(2),
                  name,
                ]}
              />
              <Scatter
                data={powerSens}
                fill="#3b82f6"
              >
                {powerSens.map((d, i) => (
                  <Cell
                    key={i}
                    fill={CATEGORY_COLORS[d.category] || "#3b82f6"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Avg YTD by Sector */}
        <BentoCard title="Avg YTD Return by Sector" subtitle="Category performance">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={sectors.sort((a, b) => b.avg_ytd_return - a.avg_ytd_return)}
              layout="vertical"
              barSize={16}
            >
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number) => [`${value}%`, "Avg YTD"]}
              />
              <Bar dataKey="avg_ytd_return" radius={[0, 4, 4, 0]}>
                {sectors.map((s, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[s.category] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none"
        >
          <option value="">All Categories</option>
          {sectors.map((s) => (
            <option key={s.category} value={s.category}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Securities Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
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
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.ticker}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-3 py-2 font-mono font-semibold text-white">
                  {s.ticker}
                </td>
                <td className="px-3 py-2 text-slate-300">{s.name}</td>
                <td className="px-3 py-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CATEGORY_COLORS[s.category] || "#6b7280"}20`,
                      color: CATEGORY_COLORS[s.category] || "#6b7280",
                    }}
                  >
                    {s.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">${s.price.toFixed(0)}</td>
                <td className="px-3 py-2 font-mono">{s.market_cap_bn.toFixed(0)}</td>
                <td
                  className={`px-3 py-2 font-mono font-bold ${
                    s.ytd_return >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {s.ytd_return > 0 ? "+" : ""}
                  {s.ytd_return.toFixed(1)}%
                </td>
                <td className="px-3 py-2 font-mono">{s.ai_infra_revenue_pct}%</td>
                <td className="px-3 py-2 font-mono">{s.power_demand_sensitivity.toFixed(2)}</td>
                <td className="px-3 py-2 font-mono">{s.esg_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
