"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ── Animated grid background ───────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <svg width="100%" height="100%" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7c3aed" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      {/* Scanning line effect */}
      <div className="scan-line" />
      {/* Corner accents */}
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
    </div>
  );
}

// ── Animated threat counter ────────────────────────────────────────────────

const THREATS = [
  "Prompt injection",
  "DAN jailbreak",
  "System prompt extraction",
  "Credential leakage",
  "Context poisoning",
  "Roleplay bypass",
  "Data exfiltration",
  "Authority impersonation",
  "Token smuggling",
  "Base64 bypass",
];

function ThreatTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % THREATS.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 bg-black/40 border border-violet/30 px-4 py-2 rounded-full backdrop-blur-sm mb-8">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
      </span>
      <span className="text-xs text-zinc-400 font-mono">DEFENDING AGAINST</span>
      <span
        className="text-xs font-600 text-violet transition-opacity duration-300 min-w-[180px]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {THREATS[index]}
      </span>
    </div>
  );
}

// ── Scan result demo card ──────────────────────────────────────────────────

function ScanDemoCard() {
  const findings = [
    { id: "jb_001", cat: "Jailbreak", sev: "CRITICAL", status: "FAILED", color: "#ef4444" },
    { id: "pi_001", cat: "Injection", sev: "CRITICAL", status: "FAILED", color: "#ef4444" },
    { id: "rb_003", cat: "Roleplay", sev: "CRITICAL", status: "FAILED", color: "#ef4444" },
    { id: "ex_003", cat: "Exfiltration", sev: "HIGH", status: "FAILED", color: "#f97316" },
    { id: "cp_003", cat: "Context", sev: "CRITICAL", status: "PASSED", color: "#22c55e" },
  ];

  return (
    <div className="relative bg-black/60 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-black/40">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-amber-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs font-mono text-zinc-500">spectre-scanner — GPT-4 audit</span>
      </div>

      {/* Scan result */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-xs text-zinc-500 mb-1">SCAN COMPLETE · https://api.openai.com/v1/chat/completions</p>
            <p className="font-mono text-xs text-green-400">✓ 42 attacks executed · 3m 14s</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-red-950/60 border-2 border-red-500/50 flex items-center justify-center">
              <span className="font-display text-3xl font-800 text-red-400">F</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">44/100</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {findings.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-3 bg-zinc-900/50 rounded-lg px-3 py-2 font-mono text-xs"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-zinc-600 w-12">{f.id}</span>
              <span className="text-zinc-400 w-20">{f.cat}</span>
              <span style={{ color: f.sev === "CRITICAL" ? "#ef4444" : "#f97316" }} className="w-16 font-600">
                {f.sev}
              </span>
              <span
                className="ml-auto font-600 px-2 py-0.5 rounded text-[10px]"
                style={{
                  color: f.status === "FAILED" ? "#ef4444" : "#22c55e",
                  background: f.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                }}
              >
                {f.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="font-mono text-xs text-red-400">⚠ 22 critical vulnerabilities detected</span>
          <span className="font-mono text-xs text-zinc-600">PDF report generated</span>
        </div>
      </div>
    </div>
  );
}

// ── How it works steps ─────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Point Scanner at your LLM",
    desc: "Enter your LLM endpoint URL and API key. Scanner fires 43 adversarial attacks across 5 threat categories — prompt injection, jailbreaks, data exfiltration, context poisoning, and roleplay bypass.",
    tag: "Pre-deployment",
    color: "#7c3aed",
  },
  {
    num: "02",
    title: "Get your security grade",
    desc: "Every attack is classified as passed or failed using keyword matching and an LLM judge. Your endpoint receives a score from 0–100 and a letter grade. A PDF report is generated automatically.",
    tag: "Minutes not days",
    color: "#0ea5e9",
  },
  {
    num: "03",
    title: "Deploy Shield to protect production",
    desc: "Install the Python SDK with one line. Shield inspects every LLM prompt and response in under 30ms using 67 detection rules. Block, redact, or alert on threats in real time.",
    tag: "Runtime protection",
    color: "#10b981",
  },
];

// ── Pricing ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Pilot",
    price: "Free",
    period: "",
    desc: "For teams evaluating AI security for the first time.",
    features: [
      "5 scans per month",
      "Quick attack suite (critical only)",
      "PDF reports",
      "Shield SDK access",
      "10,000 Shield inspections/month",
      "Email support",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$299",
    period: "/month",
    desc: "For engineering teams shipping LLM applications to production.",
    features: [
      "Unlimited scans",
      "Full 43-attack suite",
      "PDF reports + remediation guide",
      "Shield SDK — unlimited inspections",
      "Policy management dashboard",
      "Violation log + CSV export",
      "Slack/webhook alerts",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with compliance requirements and scale.",
    features: [
      "Everything in Starter",
      "Custom attack library",
      "OWASP LLM Top 10 reports",
      "NIST AI RMF mapping",
      "SSO / SAML",
      "Dedicated deployment",
      "SLA guarantee",
      "Dedicated security engineer",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

// ── Main page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 overflow-x-hidden">
      <style>{`
        @keyframes scanMove {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent);
          animation: scanMove 8s linear infinite;
          top: 0;
        }
        .corner-accent {
          position: absolute;
          width: 60px; height: 60px;
        }
        .corner-accent.top-left {
          top: 80px; left: 20px;
          border-top: 1px solid rgba(124,58,237,0.4);
          border-left: 1px solid rgba(124,58,237,0.4);
        }
        .corner-accent.top-right {
          top: 80px; right: 20px;
          border-top: 1px solid rgba(124,58,237,0.4);
          border-right: 1px solid rgba(124,58,237,0.4);
        }
        .glow-text {
          text-shadow: 0 0 40px rgba(124,58,237,0.5);
        }
        .card-hover {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          border-color: rgba(124,58,237,0.4);
        }
        .plan-highlight {
          background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(14,165,233,0.08) 100%);
        }
      `}</style>

      <GridBackground />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#060608]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed"/>
              <circle cx="10" cy="13" r="1.5" fill="#060608"/>
              <circle cx="18" cy="13" r="1.5" fill="#060608"/>
            </svg>
            <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.5px" }}>
              Spectre<span style={{ color: "#7c3aed" }}> Security</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#how-it-works" className="hover:text-zinc-200 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-zinc-200 transition-colors">Pricing</a>
          </div>
          <Link
            href="/login"
            className="text-sm font-600 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#7c3aed" }}
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <ThreatTicker />

            <h1
              className="glow-text mb-6"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(52px, 8vw, 96px)",
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: "-3px",
                color: "#f4f4f5",
              }}
            >
              Security for the
              <br />
              <span style={{ color: "#7c3aed" }}>AI-native stack</span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ fontSize: "20px" }}>
              Test your LLM applications for vulnerabilities before deployment.
              Protect them in production with real-time DLP. Under 30ms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/login"
                className="w-full sm:w-auto text-base font-600 text-white px-8 py-4 rounded-xl transition-all"
                style={{ background: "#7c3aed", fontSize: "16px" }}
              >
                Start for free →
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto text-base font-500 text-zinc-400 hover:text-zinc-200 px-8 py-4 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all"
                style={{ fontSize: "16px" }}
              >
                See how it works
              </a>
            </div>

            <p className="text-sm text-zinc-600">No credit card required · Pilot plan is free</p>
          </div>

          {/* Demo scan card */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-mono text-zinc-500 text-center mb-3 uppercase tracking-widest">
              Live scan result — raw GPT-4 endpoint
            </p>
            <ScanDemoCard />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-black/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "43", label: "Attack vectors" },
            { value: "67", label: "Detection rules" },
            { value: "<30ms", label: "Inspection latency" },
            { value: "Grade F", label: "Raw GPT-4 score" },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="mb-1"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#7c3aed",
                }}
              >
                {s.value}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-violet/70 uppercase tracking-widest mb-3">How it works</p>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-1.5px",
                color: "#f4f4f5",
              }}
            >
              From zero to secured
              <br />
              <span className="text-zinc-500">in under an hour</span>
            </h2>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="card-hover relative bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-8 flex gap-8 items-start backdrop-blur-sm"
              >
                <div className="shrink-0">
                  <p
                    className="font-mono font-700"
                    style={{ fontSize: "48px", color: step.color, opacity: 0.3, lineHeight: 1 }}
                  >
                    {step.num}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#f4f4f5",
                      }}
                    >
                      {step.title}
                    </h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full border"
                      style={{ color: step.color, borderColor: step.color + "40", background: step.color + "10" }}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed" style={{ fontSize: "16px" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat categories */}
      <section className="py-16 px-6 bg-black/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
            Threat categories detected
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Prompt injection", count: "15 attacks" },
              { label: "Jailbreak", count: "10 attacks" },
              { label: "Data exfiltration", count: "8 attacks" },
              { label: "Context poisoning", count: "5 attacks" },
              { label: "Roleplay bypass", count: "5 attacks" },
            ].map((t) => (
              <div
                key={t.label}
                className="card-hover flex items-center gap-3 bg-zinc-950/60 border border-zinc-800 px-4 py-3 rounded-xl backdrop-blur-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span className="text-sm text-zinc-300 font-500">{t.label}</span>
                <span className="text-xs font-mono text-zinc-600">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-violet/70 uppercase tracking-widest mb-3">Pricing</p>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-1.5px",
                color: "#f4f4f5",
              }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-zinc-400 mt-4 text-lg">Start free. Scale when you're ready.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`card-hover relative rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? "plan-highlight border-violet/40"
                    : "bg-zinc-950/60 border-zinc-800/80"
                } backdrop-blur-sm`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-xs font-600 px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p
                    className="font-mono text-xs uppercase tracking-widest mb-2"
                    style={{ color: plan.highlight ? "#7c3aed" : "#71717a" }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontSize: "42px",
                        fontWeight: 700,
                        color: "#f4f4f5",
                        lineHeight: 1,
                      }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-zinc-500 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className="w-full text-center text-sm font-600 py-3 rounded-xl transition-all"
                  style={{
                    background: plan.highlight ? "#7c3aed" : "transparent",
                    color: plan.highlight ? "white" : "#a1a1aa",
                    border: plan.highlight ? "none" : "1px solid #3f3f46",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-600 mt-8">
            All plans include the Spectre Shield SDK and detection engine. No hidden fees.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-1px",
              color: "#f4f4f5",
            }}
          >
            Your LLM has vulnerabilities.
            <br />
            <span style={{ color: "#7c3aed" }}>Find them before attackers do.</span>
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Run your first scan free. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block text-base font-600 text-white px-10 py-4 rounded-xl transition-all hover:opacity-90"
            style={{ background: "#7c3aed", fontSize: "16px" }}
          >
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.6"/>
            </svg>
            <span className="text-xs text-zinc-700">Spectre Security · AI Runtime Protection · v0.1.0-mvp</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-700">
            <a href="#how-it-works" className="hover:text-zinc-400 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-zinc-400 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
