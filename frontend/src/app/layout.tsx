import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { Globe, BarChart3, Layers, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "InfraSphere — AI Infrastructure & Power Grid Convergence",
  description:
    "3D interactive platform tracking AI data-centre build-out, power grid capacity, and infrastructure investment opportunities.",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: Globe },
  { href: "/securities", label: "Securities", icon: BarChart3 },
  { href: "/scenarios", label: "Scenarios", icon: Layers },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
];

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/70 backdrop-blur-2xl">
      <div className="max-w-[1600px] 3xl:max-w-[85vw] 4xl:max-w-[90vw] mx-auto px-6 3xl:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Animated gradient logo */}
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity blur-[2px]" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 flex items-center justify-center text-[12px] font-black text-white shadow-lg shadow-blue-500/20">
              IS
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight gradient-text">
              InfraSphere
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 -mt-0.5">
              AI Infrastructure Intelligence
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all duration-200"
              >
                <Icon size={15} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col">
        {/* Animated mesh gradient background */}
        <div className="mesh-bg" />

        <Nav />
        <main className="flex-1 relative">{children}</main>
        <footer className="border-t border-white/[0.05] py-5">
          <div className="max-w-[1600px] 3xl:max-w-[85vw] 4xl:max-w-[90vw] mx-auto px-6 3xl:px-10 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              InfraSphere — AI Infrastructure & Power Grid Convergence
            </span>
            <span>Built by <span className="text-slate-400 font-medium">Nhat Nguyen</span></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
