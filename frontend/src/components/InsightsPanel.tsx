"use client";
/**
 * AI Insights sidebar panel — streams rule-based insights styled
 * like a premium AI co-pilot feed with animations.
 */
import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, Zap, Info, Sparkles } from "lucide-react";
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

function severityBg(severity: string): string {
  switch (severity) {
    case "critical": return "rgba(239,68,68,0.06)";
    case "warning": return "rgba(245,158,11,0.06)";
    case "opportunity": return "rgba(16,185,129,0.06)";
    case "info": return "rgba(59,130,246,0.06)";
    default: return "rgba(255,255,255,0.02)";
  }
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Sparkles size={16} className="text-purple-400" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest gradient-text">
          AI Insights Engine
        </span>
      </div>

      {insights.map((ins, i) => (
        <motion.div
          key={ins.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="glass-card p-3.5 hover:border-white/15 transition-all cursor-default group"
          style={{ background: severityBg(ins.severity) }}
        >
          <div className="flex items-start gap-2.5 mb-1.5">
            <div className="mt-0.5">
              <SeverityIcon severity={ins.severity} />
            </div>
            <span
              className="text-sm font-bold leading-tight"
              style={{ color: severityColor(ins.severity) }}
            >
              {ins.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed ml-[26px] mb-2.5">
            {ins.description}
          </p>
          {ins.tickers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-[26px]">
              {ins.tickers.map((t) => (
                <span
                  key={t}
                  className="tag-pill bg-white/[0.06] border border-white/10 text-slate-300 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 mt-3">
        <div className="w-1 h-1 rounded-full bg-slate-600" />
        <span>Analysis from curated infrastructure data</span>
        <div className="w-1 h-1 rounded-full bg-slate-600" />
      </div>
    </div>
  );
}
