"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar,
} from "recharts";
import { Play, RotateCcw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

import type { ScenarioInput, ScenarioResult } from "@/lib/api";
import { runScenario, fetchScenarioDefaults } from "@/lib/api";
import { CATEGORY_COLORS, severityColor } from "@/lib/globe-utils";
import BentoCard from "@/components/BentoCard";

// ---------------------------------------------------------------------------
// Slider component
// ---------------------------------------------------------------------------
function ParamSlider({
  label, value, min, max, step, unit, onChange, description,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void; description: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-mono font-bold text-white">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-300"
      />
      <p className="text-[10px] text-slate-500">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal badge
// ---------------------------------------------------------------------------
function SignalBadge({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    strong_buy: "bg-emerald-500/20 text-emerald-400",
    buy: "bg-emerald-500/10 text-emerald-300",
    hold: "bg-slate-500/20 text-slate-300",
    sell: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
        colors[signal] || "bg-slate-500/20 text-slate-300"
      }`}
    >
      {signal.replace("_", " ")}
    </span>
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
      <div className="flex items-center justify-center h-[60vh] text-slate-400 animate-pulse">
        Loading scenario engine...
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">What-If Scenario Builder</h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust macro parameters and see how they impact grid strain, capex, and security valuations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Controls panel */}
        <div className="glass-card p-5 space-y-5">
          <ParamSlider
            label="AI Demand Growth"
            value={inputs.ai_demand_growth_pct}
            min={5} max={80} step={1} unit="%"
            onChange={(v) => setInputs({ ...inputs, ai_demand_growth_pct: v })}
            description="Year-over-year AI power demand growth rate"
          />
          <ParamSlider
            label="Interest Rate"
            value={inputs.interest_rate_pct}
            min={1} max={10} step={0.1} unit="%"
            onChange={(v) => setInputs({ ...inputs, interest_rate_pct: v })}
            description="Benchmark rate — higher rates increase capex costs"
          />
          <ParamSlider
            label="Power Price Change"
            value={inputs.power_price_change_pct}
            min={-30} max={50} step={1} unit="%"
            onChange={(v) => setInputs({ ...inputs, power_price_change_pct: v })}
            description="Electricity price delta from current levels"
          />
          <ParamSlider
            label="Renewable Buildout"
            value={inputs.renewable_buildout_multiplier}
            min={0.3} max={3.0} step={0.1} unit="x"
            onChange={(v) => setInputs({ ...inputs, renewable_buildout_multiplier: v })}
            description="Multiplier for planned renewable additions"
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleRun}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Play size={14} />
              {loading ? "Running..." : "Run Scenario"}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 text-sm rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {!result && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-400">
              <AlertTriangle size={32} className="mb-3 text-slate-500" />
              <p className="text-sm">Adjust parameters and click &quot;Run Scenario&quot; to see results</p>
            </div>
          )}

          {result && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    ${result.aggregate_capex_bn.toFixed(1)}B
                  </div>
                  <div className="text-[11px] text-slate-500">Required Capex</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div
                    className={`text-2xl font-bold ${
                      result.aggregate_strain_delta > 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {result.aggregate_strain_delta > 0 ? "+" : ""}
                    {(result.aggregate_strain_delta * 100).toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500">Avg Strain Delta</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div
                    className={`text-2xl font-bold ${
                      result.avg_security_impact > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.avg_security_impact > 0 ? "+" : ""}
                    {result.avg_security_impact.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-500">Avg Security Impact</div>
                </div>
              </div>

              {/* Insights */}
              {result.insights.length > 0 && (
                <div className="glass-card p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Scenario Insights
                  </div>
                  <div className="space-y-2">
                    {result.insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        {ins}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regional Impact + Security tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Regional Impact bar */}
                <BentoCard title="Regional Grid Impact" subtitle="Strain change by region" glow="orange">
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
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        formatter={(value: number, name: string) => [`${value}%`, name]}
                      />
                      <Bar dataKey="baseline" fill="#475569" radius={[3, 3, 0, 0]} name="Baseline" />
                      <Bar dataKey="scenario" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Scenario" />
                    </BarChart>
                  </ResponsiveContainer>
                </BentoCard>

                {/* Top Beneficiaries */}
                <BentoCard title="Security Impact" subtitle="Top beneficiaries and losers" glow="green">
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                      Top Beneficiaries
                    </div>
                    {result.top_beneficiaries.slice(0, 5).map((s) => (
                      <div key={s.ticker} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{s.ticker}</span>
                          <span
                            className="text-[10px] px-1.5 py-0 rounded"
                            style={{
                              background: `${CATEGORY_COLORS[s.category] || "#6b7280"}20`,
                              color: CATEGORY_COLORS[s.category] || "#6b7280",
                            }}
                          >
                            {s.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-mono">
                            +{s.score_delta.toFixed(1)}
                          </span>
                          <SignalBadge signal={s.signal} />
                        </div>
                      </div>
                    ))}

                    <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mt-3 mb-1">
                      Most Exposed
                    </div>
                    {result.top_losers.slice(0, 3).map((s) => (
                      <div key={s.ticker} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{s.ticker}</span>
                          <span className="text-[10px] text-slate-500">
                            {s.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-mono">
                            {s.score_delta.toFixed(1)}
                          </span>
                          <SignalBadge signal={s.signal} />
                        </div>
                      </div>
                    ))}
                  </div>
                </BentoCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
