"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STATS = [
  { value: "43", label: "Attack vectors" },
  { value: "67", label: "Detection rules" },
  { value: "<30ms", label: "Inspection latency" },
  { value: "5", label: "Threat categories" },
];

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M10 6v5M10 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Spectre Scanner",
    description: "Fire 43 adversarial attacks against any LLM endpoint. Get a security grade, detailed findings, and a PDF report your CISO can act on.",
    badge: "Pre-deployment",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L3 5.5v5.5c0 4 3 7 7 7s7-3 7-7V5.5L10 2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Spectre Shield",
    description: "Runtime DLP proxy that inspects every LLM prompt and response in under 30ms. Block, redact, or alert on 67 threat patterns.",
    badge: "Real-time",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M7 10h6M7 7h6M7 13h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
    title: "Audit & Reports",
    description: "Every inspection logged, every violation tracked. Generate branded PDF reports and export violation logs for compliance.",
    badge: "Always-on",
  },
];

const THREATS = [
  "Prompt injection",
  "Jailbreak attempts",
  "System prompt extraction",
  "Credential leakage",
  "Context poisoning",
  "Roleplay bypass",
  "Data exfiltration",
  "Authority impersonation",
];

export default function LandingPage() {
  const [threatIndex, setThreatIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatIndex((i) => (i + 1) % THREATS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-obsidian-700 bg-obsidian-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.9"/>
              <circle cx="10" cy="13" r="1.5" fill="#0d0d12"/>
              <circle cx="18" cy="13" r="1.5" fill="#0d0d12"/>
            </svg>
            <span className="font-display text-sm font-600 tracking-tight">
              Spectre<span className="text-violet"> Security</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 hidden sm:block">AI Security Platform</span>
            <Link
              href="/login"
              className="bg-violet hover:bg-violet-dim text-white text-xs font-500 px-3.5 py-2 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 65%)" }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet/10 border border-violet/20 text-violet text-xs font-500 px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-violet rounded-full animate-pulse-slow" />
            Now defending against {THREATS[threatIndex]}
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-800 tracking-tight text-zinc-50 mb-6 leading-tight">
            Security for the
            <br />
            <span className="text-violet">AI-native stack</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Spectre Security tests your LLM applications for vulnerabilities before deployment
            and protects them in production — in real time, under 30ms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-violet hover:bg-violet-dim text-white font-500 px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Access the platform
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600 text-zinc-300 font-500 px-6 py-3 rounded-lg transition-colors text-sm"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-obsidian-700 bg-obsidian-900/50 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-700 text-violet mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-700 text-zinc-50 mb-3">
              Two products. One platform.
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Scanner finds vulnerabilities before you ship. Shield stops attacks when they happen.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-obsidian-900 border border-obsidian-600 rounded-xl p-6 hover:border-violet/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-violet/10 border border-violet/20 flex items-center justify-center text-violet">
                    {f.icon}
                  </div>
                  <span className="text-[10px] text-violet bg-violet/10 border border-violet/20 px-2 py-0.5 rounded-full font-500 uppercase tracking-wide">
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-display text-base font-600 text-zinc-100 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat categories */}
      <section className="py-16 px-6 bg-obsidian-900/30 border-y border-obsidian-700">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
            Threat categories detected
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {THREATS.map((threat) => (
              <span
                key={threat}
                className="text-xs text-zinc-400 bg-obsidian-800 border border-obsidian-600 px-3 py-1.5 rounded-full"
              >
                {threat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-700 text-zinc-50 mb-4">
            Ready to secure your LLM?
          </h2>
          <p className="text-zinc-500 mb-8">
            Get access to the Spectre Security platform and run your first scan in minutes.
          </p>
          <Link
            href="/login"
            className="inline-block bg-violet hover:bg-violet-dim text-white font-500 px-8 py-3 rounded-lg transition-colors"
          >
            Access the platform
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-obsidian-700 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.7"/>
            </svg>
            <span className="text-xs text-zinc-600">Spectre Security · AI Runtime Protection</span>
          </div>
          <span className="text-xs text-zinc-700">v0.1.0-mvp</span>
        </div>
      </footer>
    </div>
  );
}
