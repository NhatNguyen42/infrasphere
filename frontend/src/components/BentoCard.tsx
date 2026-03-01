"use client";
/**
 * Reusable bento card with glassmorphism, animated glow borders, and hover lift.
 */
import React from "react";
import { motion } from "framer-motion";

interface BentoCardProps {
  title: string;
  subtitle?: string;
  glow?: "blue" | "green" | "orange" | "purple" | "cyan" | "none";
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export default function BentoCard({
  title,
  subtitle,
  glow = "none",
  className = "",
  children,
  delay = 0,
}: BentoCardProps) {
  const glowClass =
    glow === "blue"
      ? "glow-blue"
      : glow === "green"
        ? "glow-green"
        : glow === "orange"
          ? "glow-orange"
          : glow === "purple"
            ? "glow-purple"
            : glow === "cyan"
              ? "glow-cyan"
              : "";

  const accentColor =
    glow === "blue"
      ? "#3b82f6"
      : glow === "green"
        ? "#10b981"
        : glow === "orange"
          ? "#f97316"
          : glow === "purple"
            ? "#8b5cf6"
            : glow === "cyan"
              ? "#06b6d4"
              : "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className={`glass-card hover-lift p-5 ${glowClass} ${className}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-4 rounded-full"
              style={{ background: accentColor }}
            />
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1 ml-3">{subtitle}</p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}10` }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: accentColor }}
          />
        </div>
      </div>
      {children}
    </motion.div>
  );
}
