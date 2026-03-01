"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  Globe as GlobeIcon, Zap, Server, TrendingUp, Activity, Download, Sparkles,
} from "lucide-react";

import type { InfraNode, GlobeData, Region, Insight } from "@/lib/api";
import {
  fetchGlobeData, fetchRegions, fetchInsights, fetchTopMovers, getReportUrl,
} from "@/lib/api";
import { CATEGORY_COLORS, formatNumber } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";
import InsightsPanel from "@/components/InsightsPanel";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

// ---------------------------------------------------------------------------
// Animated stat card with gradient accent
// ---------------------------------------------------------------------------
function StatCard({
  label, value, unit, icon, gradient, delay,
}: {
  label: string; value: string; unit?: string;
  icon: React.ReactNode; gradient: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="glass-card hover-lift p-5 relative overflow-hidden group"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: gradient }}
      />
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{ background: gradient }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: `${gradient.split(",")[0]?.replace("linear-gradient(135deg, ", "") || "#3b82f6"}15` }}
        >
          {icon}
        </div>
        <div>
          <div className="text-2xl font-extrabold tracking-tight animate-count">
            {value}
            {unit && <span className="text-sm text-slate-400 ml-1 font-medium">{unit}</span>}
          </div>
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

function StrainGauge({ region, index }: { region: Region; index: number }) {
  const pct = Math.round(region.grid_strain_index * 100);
  const barColor = pct > 85 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <div className="w-20 truncate text-xs text-slate-400 font-medium">{region.id}</div>
      <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.05, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${barColor}80, ${barColor})` }}
        />
      </div>
      <div className="w-12 text-right text-xs font-mono font-bold" style={{ color: barColor }}>
        {pct}%
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [globeData, setGlobeData] = useState<GlobeData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [movers, setMovers] = useState<{ ticker: string; name: string; ytd_return: number; category: string }[]>([]);
  const [selectedNode, setSelectedNode] = useState<InfraNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGlobeData(), fetchRegions(), fetchInsights(), fetchTopMovers(8)])
      .then(([g, r, i, m]) => {
        setGlobeData(g);
        setRegions(r);
        setInsights(i);
        setMovers(m);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!regions.length) return null;
    const totalDC = regions.reduce((s, r) => s + r.data_center_count, 0);
    const totalAI = regions.reduce((s, r) => s + r.ai_demand_gw, 0);
    const totalCap = regions.reduce((s, r) => s + r.grid_capacity_gw, 0);
    const totalRenew = regions.reduce((s, r) => s + r.renewable_capacity_gw, 0);
    return { totalDC, totalAI, totalCap, totalRenew };
  }, [regions]);

  const demandChart = useMemo(
    () =>
      regions
        .filter((r) => r.country === "US")
        .map((r) => ({
          name: r.id,
          demand: r.current_demand_gw,
          ai: r.ai_demand_gw,
          capacity: r.grid_capacity_gw,
        })),
    [regions]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            <GlobeIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          </div>
          <span className="text-slate-400 text-sm font-medium">Loading InfraSphere...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[min(1600px,92vw)] mx-auto px-6 py-8">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time AI infrastructure monitoring &amp; grid convergence analytics
        </p>
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Data Centres"
          value={stats ? stats.totalDC.toLocaleString() : "—"}
          icon={<Server size={20} className="text-orange-400" />}
          gradient="linear-gradient(135deg, #f97316, #ea580c)"
          delay={0}
        />
        <StatCard
          label="AI Power Demand"
          value={stats ? `${stats.totalAI.toFixed(1)}` : "—"}
          unit="GW"
          icon={<Zap size={20} className="text-cyan-400" />}
          gradient="linear-gradient(135deg, #06b6d4, #0891b2)"
          delay={0.1}
        />
        <StatCard
          label="Grid Capacity"
          value={stats ? formatNumber(stats.totalCap) : "—"}
          unit="GW"
          icon={<Activity size={20} className="text-purple-400" />}
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          delay={0.2}
        />
        <StatCard
          label="Renewable Cap"
          value={stats ? formatNumber(stats.totalRenew) : "—"}
          unit="GW"
          icon={<TrendingUp size={20} className="text-emerald-400" />}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          delay={0.3}
        />
      </div>

      {/* ── Globe + Insights ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-card glow-blue p-0 overflow-hidden relative"
          style={{ minHeight: 520 }}
        >
          {globeData && (
            <Globe nodes={globeData.nodes} connections={globeData.connections} onNodeClick={setSelectedNode} />
          )}
          <div className="absolute bottom-4 left-4 flex gap-3 text-[10px]">
            {[
              { label: "Data Centre", color: "#f97316" },
              { label: "Nuclear / Gas", color: "#06b6d4" },
              { label: "Renewable", color: "#10b981" },
              { label: "Grid Hub", color: "#8b5cf6" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}80` }} />
                <span className="text-slate-300 font-medium">{l.label}</span>
              </div>
            ))}
          </div>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 glass-card p-4 max-w-[260px] glow-purple"
            >
              <div className="text-sm font-bold text-white mb-2">{selectedNode.name}</div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Region</span><span className="text-slate-200">{selectedNode.region}</span></div>
                <div className="flex justify-between"><span>Capacity</span><span className="text-slate-200">{selectedNode.capacity_mw.toLocaleString()} MW</span></div>
                <div className="flex justify-between"><span>Utilization</span><span className="text-slate-200">{(selectedNode.utilization * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span>Growth</span><span className="text-emerald-400">{(selectedNode.growth_rate * 100).toFixed(0)}% YoY</span></div>
                <div className="flex justify-between"><span>Capex</span><span className="text-amber-400">${selectedNode.capex_bn}B</span></div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-[10px] text-slate-500 hover:text-white mt-3 underline decoration-dotted">Close</button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-5 glow-purple"
          style={{ maxHeight: 560, overflow: "hidden" }}
        >
          <InsightsPanel insights={insights} />
        </motion.div>
      </div>

      {/* ── Bento grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <BentoCard title="Grid Strain Index" subtitle="Demand / Capacity by region" glow="orange" delay={1}>
          <div className="space-y-2.5">
            {regions
              .sort((a, b) => b.grid_strain_index - a.grid_strain_index)
              .slice(0, 8)
              .map((r, i) => (
                <StrainGauge key={r.id} region={r} index={i} />
              ))}
          </div>
        </BentoCard>

        <BentoCard title="Top Movers" subtitle="AI infrastructure equities" glow="cyan" delay={2}>
          <div className="space-y-2">
            {movers.map((m, i) => (
              <motion.div
                key={m.ticker}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center justify-between text-xs hover:bg-white/[0.02] rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[m.category] || "#6b7280", boxShadow: `0 0 6px ${CATEGORY_COLORS[m.category] || "#6b7280"}60` }} />
                  <span className="font-mono font-bold text-white">{m.ticker}</span>
                  <span className="text-slate-500 truncate max-w-[90px]">{m.name}</span>
                </div>
                <span className={`font-mono font-bold ${m.ytd_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {m.ytd_return >= 0 ? "+" : ""}{m.ytd_return.toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </div>
        </BentoCard>

        <BentoCard title="Regional Power Demand" subtitle="US grid regions (GW)" glow="blue" delay={3}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={demandChart} barGap={4}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
              <Bar dataKey="demand" fill="url(#barBlue)" radius={[6, 6, 0, 0]} name="Total Demand" />
              <Bar dataKey="ai" fill="url(#barOrange)" radius={[6, 6, 0, 0]} name="AI Demand" />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard title="AI Demand Growth" subtitle="Year-over-year by region" glow="green" delay={4}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={regions
                .filter((r) => r.ai_demand_growth_pct > 0)
                .sort((a, b) => b.ai_demand_growth_pct - a.ai_demand_growth_pct)
                .slice(0, 8)
                .map((r) => ({ name: r.id, growth: r.ai_demand_growth_pct }))}
              layout="vertical"
              barSize={16}
            >
              <defs>
                <linearGradient id="barGreen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} formatter={(value: number) => [`${value}%`, "AI Growth"]} />
              <Bar dataKey="growth" fill="url(#barGreen)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard title="Data Centre Capex" subtitle="By region (committed $B)" glow="purple" delay={5}>
          {globeData && (
            <div className="space-y-2">
              {(() => {
                const byRegion: Record<string, number> = {};
                globeData.nodes.filter((n) => n.type === "data_center").forEach((n) => { byRegion[n.region] = (byRegion[n.region] || 0) + n.capex_bn; });
                return Object.entries(byRegion).sort(([, a], [, b]) => b - a).map(([region, capex], i) => (
                  <motion.div key={region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex items-center justify-between text-xs hover:bg-white/[0.02] rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <span className="text-slate-400 font-medium">{region}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((capex / 15) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
                          className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf680, #8b5cf6)" }} />
                      </div>
                      <span className="font-mono font-bold text-white w-14 text-right">${capex.toFixed(1)}B</span>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          )}
        </BentoCard>

        <BentoCard title="Infrastructure Report" subtitle="Download full PDF analysis" delay={6}>
          <div className="flex flex-col items-center justify-center h-[150px] gap-4">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <Download size={28} className="text-blue-400" />
              </div>
            </motion.div>
            <a href={getReportUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
              <Sparkles size={14} />
              Download PDF Report
            </a>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
