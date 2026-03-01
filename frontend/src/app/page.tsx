"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  Globe as GlobeIcon, Zap, Server, TrendingUp, Activity, Download,
} from "lucide-react";

import type { InfraNode, GlobeData, Region, Insight } from "@/lib/api";
import {
  fetchGlobeData, fetchRegions, fetchInsights, fetchTopMovers, getReportUrl,
} from "@/lib/api";
import { CATEGORY_COLORS, formatNumber } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";
import InsightsPanel from "@/components/InsightsPanel";

// Dynamic import — Three.js must be client-only
const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

// ---------------------------------------------------------------------------
// Mini components for the bento grid
// ---------------------------------------------------------------------------
function StatCard({
  label, value, unit, icon, color,
}: {
  label: string; value: string; unit?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold">
          {value}
          {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
        </div>
        <div className="text-[11px] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function StrainGauge({ region }: { region: Region }) {
  const pct = Math.round(region.grid_strain_index * 100);
  const barColor =
    pct > 85 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 truncate text-xs text-slate-400">{region.id}</div>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <div className="w-10 text-right text-xs font-mono" style={{ color: barColor }}>
        {pct}%
      </div>
    </div>
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

  // Aggregate stats
  const stats = useMemo(() => {
    if (!regions.length) return null;
    const totalDC = regions.reduce((s, r) => s + r.data_center_count, 0);
    const totalAI = regions.reduce((s, r) => s + r.ai_demand_gw, 0);
    const totalCap = regions.reduce((s, r) => s + r.grid_capacity_gw, 0);
    const totalRenew = regions.reduce((s, r) => s + r.renewable_capacity_gw, 0);
    return { totalDC, totalAI, totalCap, totalRenew };
  }, [regions]);

  // Power demand mini chart data (from regions)
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
        <div className="text-slate-400 animate-pulse flex items-center gap-2">
          <GlobeIcon className="w-5 h-5" /> Loading InfraSphere...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Data Centres Tracked"
          value={stats ? stats.totalDC.toLocaleString() : "—"}
          icon={<Server size={18} className="text-orange-400" />}
          color="#f97316"
        />
        <StatCard
          label="AI Power Demand"
          value={stats ? `${stats.totalAI.toFixed(1)}` : "—"}
          unit="GW"
          icon={<Zap size={18} className="text-cyan-400" />}
          color="#06b6d4"
        />
        <StatCard
          label="Global Grid Capacity"
          value={stats ? formatNumber(stats.totalCap) : "—"}
          unit="GW"
          icon={<Activity size={18} className="text-purple-400" />}
          color="#8b5cf6"
        />
        <StatCard
          label="Renewable Capacity"
          value={stats ? formatNumber(stats.totalRenew) : "—"}
          unit="GW"
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          color="#10b981"
        />
      </div>

      {/* ── Globe + Insights ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 mb-4">
        {/* Globe */}
        <div className="glass-card glow-blue p-0 overflow-hidden relative" style={{ minHeight: 480 }}>
          {globeData && (
            <Globe
              nodes={globeData.nodes}
              connections={globeData.connections}
              onNodeClick={setSelectedNode}
            />
          )}
          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-3 text-[10px]">
            {[
              { label: "Data Centre", color: "#f97316" },
              { label: "Nuclear / Gas", color: "#06b6d4" },
              { label: "Renewable", color: "#10b981" },
              { label: "Grid Hub", color: "#8b5cf6" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Selected node detail */}
          {selectedNode && (
            <div className="absolute top-3 right-3 glass-card p-3 max-w-[240px]">
              <div className="text-sm font-bold text-slate-200 mb-1">
                {selectedNode.name}
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Region: {selectedNode.region}</div>
                <div>Capacity: {selectedNode.capacity_mw.toLocaleString()} MW</div>
                <div>Utilization: {(selectedNode.utilization * 100).toFixed(0)}%</div>
                <div>Growth: {(selectedNode.growth_rate * 100).toFixed(0)}% YoY</div>
                <div>Capex: ${selectedNode.capex_bn}B</div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-slate-500 hover:text-white mt-2 underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Insights sidebar */}
        <div className="glass-card p-4" style={{ maxHeight: 520, overflow: "hidden" }}>
          <InsightsPanel insights={insights} />
        </div>
      </div>

      {/* ── Bento grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Grid Strain */}
        <BentoCard title="Grid Strain Index" subtitle="Demand / Capacity by region" glow="orange">
          <div className="space-y-2">
            {regions
              .sort((a, b) => b.grid_strain_index - a.grid_strain_index)
              .slice(0, 8)
              .map((r) => (
                <StrainGauge key={r.id} region={r} />
              ))}
          </div>
        </BentoCard>

        {/* Top Movers */}
        <BentoCard title="Top Movers" subtitle="AI infrastructure equities">
          <div className="space-y-1.5">
            {movers.map((m) => (
              <div key={m.ticker} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: CATEGORY_COLORS[m.category] || "#6b7280",
                    }}
                  />
                  <span className="font-mono font-semibold text-slate-200">
                    {m.ticker}
                  </span>
                  <span className="text-slate-500 truncate max-w-[100px]">
                    {m.name}
                  </span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    m.ytd_return >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {m.ytd_return >= 0 ? "+" : ""}
                  {m.ytd_return.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Power Demand by Region bar chart */}
        <BentoCard title="Regional Power Demand" subtitle="US grid regions (GW)" glow="blue">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={demandChart} barGap={2}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar dataKey="demand" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Total Demand" />
              <Bar dataKey="ai" fill="#f97316" radius={[3, 3, 0, 0]} name="AI Demand" />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* AI Demand Growth */}
        <BentoCard title="AI Demand Growth" subtitle="Year-over-year by region" glow="green">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={regions
                .filter((r) => r.ai_demand_growth_pct > 0)
                .sort((a, b) => b.ai_demand_growth_pct - a.ai_demand_growth_pct)
                .slice(0, 8)
                .map((r) => ({ name: r.id, growth: r.ai_demand_growth_pct }))}
              layout="vertical"
              barSize={14}
            >
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number) => [`${value}%`, "AI Growth"]}
              />
              <Bar dataKey="growth" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Capex Tracker */}
        <BentoCard title="Data Centre Capex" subtitle="By region (committed $B)">
          {globeData && (
            <div className="space-y-1.5">
              {(() => {
                const byRegion: Record<string, number> = {};
                globeData.nodes
                  .filter((n) => n.type === "data_center")
                  .forEach((n) => {
                    byRegion[n.region] = (byRegion[n.region] || 0) + n.capex_bn;
                  });
                return Object.entries(byRegion)
                  .sort(([, a], [, b]) => b - a)
                  .map(([region, capex]) => (
                    <div key={region} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{region}</span>
                      <span className="font-mono font-semibold text-slate-200">
                        ${capex.toFixed(1)}B
                      </span>
                    </div>
                  ));
              })()}
            </div>
          )}
        </BentoCard>

        {/* Download Report */}
        <BentoCard title="Infrastructure Report" subtitle="Download full PDF analysis">
          <div className="flex flex-col items-center justify-center h-[140px] gap-3">
            <Download size={32} className="text-slate-400" />
            <a
              href={getReportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Download PDF Report
            </a>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
