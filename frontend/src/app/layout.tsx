import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "InfraSphere — AI Infrastructure & Power Grid Convergence",
  description:
    "3D interactive platform tracking AI data-centre build-out, power grid capacity, and infrastructure investment opportunities.",
};

function Nav() {
  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/securities", label: "Securities" },
    { href: "/scenarios", label: "Scenarios" },
    { href: "/forecasts", label: "Forecasts" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[11px] font-black text-white">
            IS
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            InfraSphere
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
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
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/[0.06] py-4">
          <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              InfraSphere — AI Infrastructure & Power Grid Convergence
            </span>
            <span>Built by Nhat Nguyen</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
