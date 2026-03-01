"use client";
/**
 * Reusable bento card with glassmorphism and optional glow.
 */
import React from "react";

interface BentoCardProps {
  title: string;
  subtitle?: string;
  glow?: "blue" | "green" | "orange" | "none";
  className?: string;
  children: React.ReactNode;
}

export default function BentoCard({
  title,
  subtitle,
  glow = "none",
  className = "",
  children,
}: BentoCardProps) {
  const glowClass =
    glow === "blue"
      ? "glow-blue"
      : glow === "green"
        ? "glow-green"
        : glow === "orange"
          ? "glow-orange"
          : "";

  return (
    <div className={`glass-card p-4 ${glowClass} ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
