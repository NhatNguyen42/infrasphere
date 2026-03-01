"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Play, RotateCcw, AlertTriangle, Zap, DollarSign, Activity } from "lucide-react";

import type { ScenarioInput, ScenarioResult } from "@/lib/api";
import { runScenario, fetchScenarioDefaults } from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";

// ---------------------------------------------------------------------------
// Slider component — modernised
// ---------------------------------------------------------------------------
function ParamSlider({
  label, value, min, max, step, unit, onChange, description, color = "#3b82f6",
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void; description: string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-200">{label}</label>
        <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg" style={{ background: `${color}18`, color }}>
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, width: `${pct}%` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full -mt-3 relative z-10 opacity-0 cursor-pointer h-6"
      />
      <p className="text-[10px] text-slate-500 -mt-1">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal badge — modernised
// ---------------------------------------------------------------------------
function SignalBadge({ signal }: { signal: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    strong_buy: { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
    buy: { bg: "rgba(16,185,129,0.08)", text: "#6ee7b7", border: "rgba(16,185,129,0.2)" },
    hold: { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.2)" },
    sell: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
  };
  const s = styles[signal] || styles.hold;
  return (
    <span className="tag-pill text-[10px] font-bold uppercase" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {signal.replace("_", " ")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ label, value, color, icon: Icon, delay = 0 }: {
  label: string; value: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5 text-center relative overflow-hidden group hover-lift"
    >
      <div className="absolute top-0 inset-x-0 h-1 rounded-b-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-[0.04]" style={{ background: color }} />
      <Icon className="w-4 h-4 mx-auto mb-2 opacity-50" style={{ color }} />
      <div className="text-2xl font-extrabold animate-count" style={{ color }}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Scenarios Page
// ---------------------------------------------------------------------------
export default function ScenariosPage() {
  const [inputs, setInputs] = useState<ScenarioInput>({
    ai_demand_growth_pct: 35,
    interest_rate_pct: 5.0,
    power_price_change_pct: 0,
    renewable_buildout_multiplier: 1.0,
  });
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchScenarioDefaults()
      .then((d) => { setInputs(d); setInitialized(true); })
      .catch(() => setInitialized(true));
  }, []);

  const handleRun = async () => {
    setLoading(true);
    try {
      const r = await runScenario(inputs);
      setResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs({
      ai_demand_growth_pct: 35,
      interest_rate_pct: 5.0,
      power_price_change_pct: 0,
      renewable_buildout_multiplier: 1.0,
    });
    setResult(null);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <span className="font-medium">Loading scenario engine...</span>
        </motion.div>
      </div>
    );
  }

  const tooltipStyle = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">What-If Scenario Builder</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Adjust macro parameters and see how they impact grid strain, capex, and security valuations
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Controls panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-5 glow-purple">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={12} className="text-purple-400" />
            Model Parameters
          </div>

          <ParamSlider
            label="AI Demand Growth" value={inputs.ai_demand_growth_pct}
            min={5} max={80} step={1} unit="%" color="#8b5cf6"
            onChange={(v) => setInputs({ ...inputs, ai_demand_growth_pct: v })}
            description="Year-over-year AI power demand growth rate"
          />
          <ParamSlider
            label="Interest Rate" value={inputs.interest_rate_pct}
            min={1} max={10} step={0.1} unit="%" color="#3b82f6"
            onChange={(v) => setInputs({ ...inputs, interest_rate_pct: v })}
            description="Benchmark rate — higher rates increase capex costs"
          />
          <ParamSlider
            label="Power Price Change" value={inputs.power_price_change_pct}
            min={-30} max={50} step={1} unit="%" color="#f59e0b"
            onChange={(v) => setInputs({ ...inputs, power_price_change_pct: v })}
            description="Electricity price delta from current levels"
          />
          <ParamSlider
            label="Renewable Buildout" value={inputs.renewable_buildout_multiplier}
            min={0.3} max={3.0} step={0.1} unit="x" color="#10b981"
            onChange={(v) => setInputs({ ...inputs, renewable_buildout_multiplier: v })}
            description="Multiplier for planned renewable additions"
          />

          <div className="flex gap-2 pt-3">
            <button onClick={handleRun} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-50">
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {loading ? "Running..." : "Run Scenario"}
            </button>
            <button onClick={handleReset}
              className="px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-sm rounded-xl transition-all border border-white/[0.06]">
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.div>

        {/* Results panel */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {!result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-16 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <AlertTriangle size={28} className="text-slate-600" />
                </div>
                <p className="text-sm font-medium">Adjust parameters and click &quot;Run Scenario&quot;</p>
                <p className="text-xs text-slate-600 mt-1">Results will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Required Capex" value={`$${result.aggregate_capex_bn.toFixed(1)}B`} color="#3b82f6" icon={DollarSign} delay={0} />
                <KpiCard
                  label="Avg Strain Delta"
                  value={`${result.aggregate_strain_delta > 0 ? "+" : ""}${(result.aggregate_strain_delta * 100).toFixed(1)}%`}
                  color={result.aggregate_strain_delta > 0 ? "#ef4444" : "#10b981"}
                  icon={Activity}
                  delay={0.08}
                />
                <KpiCard
                  label="Avg Security Impact"
                  value={`${result.avg_security_impact > 0 ? "+" : ""}${result.avg_security_impact.toFixed(1)}`}
                  color={result.avg_security_impact > 0 ? "#10b981" : "#ef4444"}
                  icon={Zap}
                  delay={0.16}
                />
              </div>

              {/* Insights */}
              {result.insights.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="glass-card p-5 glow-blue">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Scenario Insights
                  </div>
                  <div className="space-y-2.5">
                    {result.insights.map((ins, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                        className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 mt-1.5 flex-shrink-0" />
                        {ins}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Regional Impact + Security tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <BentoCard title="Regional Grid Impact" subtitle="Strain change by region" glow="orange" delay={3}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={result.region_impacts
                        .sort((a, b) => b.strain_delta - a.strain_delta)
                        .map((r) => ({
                          name: r.region_id,
                          baseline: Math.round(r.baseline_strain * 100),
                          scenario: Math.round(r.scenario_strain * 100),
                          delta: Math.round(r.strain_delta * 100),
                        }))}
                    >
                      <defs>
                        <linearGradient id="gradScenario" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value}%`, name]} />
                      <Bar dataKey="baseline" fill="#334155" radius={[4, 4, 0, 0]} name="Baseline" />
                      <Bar dataKey="scenario" fill="url(#gradScenario)" radius={[4, 4, 0, 0]} name="Scenario" />
                    </BarChart>
                  </ResponsiveContainer>
                </BentoCard>

                <BentoCard title="Security Impact" subtitle="Top beneficiaries and losers" glow="green" delay={4}>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Top Beneficiaries
                    </div>
                    {result.top_beneficiaries.slice(0, 5).map((s, i) => (
                      <motion.div key={s.ticker} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{s.ticker}</span>
                          <span className="tag-pill" style={{
                            background: `${CATEGORY_COLORS[s.category] || "#6b7280"}12`,
                            color: CATEGORY_COLORS[s.category] || "#6b7280",
                            borderColor: `${CATEGORY_COLORS[s.category] || "#6b7280"}30`,
                          }}>
                            {s.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-mono font-bold">+{s.score_delta.toFixed(1)}</span>
                          <SignalBadge signal={s.signal} />
                        </div>
                      </motion.div>
                    ))}

                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-red-400" />
                      Most Exposed
                    </div>
                    {result.top_losers.slice(0, 3).map((s, i) => (
                      <motion.div key={s.ticker} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{s.ticker}</span>
                          <span className="text-[10px] text-slate-500">{s.category.replace(/_/g, " ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-mono font-bold">{s.score_delta.toFixed(1)}</span>
                          <SignalBadge signal={s.signal} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </BentoCard>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
