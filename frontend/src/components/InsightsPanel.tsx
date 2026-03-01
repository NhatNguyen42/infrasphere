"use client";
/**
 * AI Insights sidebar panel — streams rule-based insights styled
 * like an AI co-pilot chat.
 */
import React from "react";
import { AlertTriangle, TrendingUp, Zap, Info, ChevronRight } from "lucide-react";
import type { Insight } from "@/lib/api";
import { severityColor } from "@/lib/globe-utils";

function SeverityIcon({ severity }: { severity: string }) {
  const size = 16;
  switch (severity) {
    case "critical":
      return <AlertTriangle size={size} className="text-red-500 flex-shrink-0" />;
    case "warning":
      return <AlertTriangle size={size} className="text-amber-500 flex-shrink-0" />;
    case "opportunity":
      return <TrendingUp size={size} className="text-emerald-500 flex-shrink-0" />;
    case "info":
      return <Info size={size} className="text-blue-500 flex-shrink-0" />;
    default:
      return <Zap size={size} className="text-slate-400 flex-shrink-0" />;
  }
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          AI Insights
        </span>
      </div>

      {insights.map((ins) => (
        <div
          key={ins.id}
          className="glass-card p-3 hover:border-white/15 transition-colors cursor-default"
        >
          <div className="flex items-start gap-2 mb-1">
            <SeverityIcon severity={ins.severity} />
            <span
              className="text-sm font-semibold leading-tight"
              style={{ color: severityColor(ins.severity) }}
            >
              {ins.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed ml-6 mb-2">
            {ins.description}
          </p>
          {ins.tickers.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-6">
              {ins.tickers.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="text-[10px] text-slate-500 mt-2 text-center">
        Analysis generated from curated infrastructure data
      </div>
    </div>
  );
}
