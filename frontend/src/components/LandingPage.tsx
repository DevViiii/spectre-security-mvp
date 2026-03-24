"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Grid background ────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <svg width="100%" height="100%" style={{ opacity: 0.03 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7c3aed" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.35), transparent)",
        animation: "scanMove 10s linear infinite",
      }}/>
      <style>{`
        @keyframes scanMove { 0%{top:0} 100%{top:100vh} }
      `}</style>
    </div>
  );
}

// ── Threat ticker ──────────────────────────────────────────────────────────

const THREATS = [
  "Prompt injection", "DAN jailbreak", "System prompt extraction",
  "Credential leakage", "Context poisoning", "Roleplay bypass",
  "Data exfiltration", "Authority impersonation", "Token smuggling", "Base64 bypass",
];

function ThreatTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIndex(i => (i + 1) % THREATS.length); setVisible(true); }, 280);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "12px",
      background: "rgba(0,0,0,0.5)", border: "1px solid rgba(124,58,237,0.25)",
      padding: "8px 16px", borderRadius: "999px", backdropFilter: "blur(8px)",
      marginBottom: "32px",
    }}>
      <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "#4ade80", opacity: 0.75,
          animation: "ping 1.5s ease-in-out infinite",
        }}/>
        <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" }}/>
      </span>
      <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "monospace", letterSpacing: "0.05em" }}>DEFENDING AGAINST</span>
      <span style={{
        fontSize: "11px", fontWeight: 600, color: "#a78bfa", fontFamily: "monospace",
        minWidth: "190px", transition: "opacity 0.28s", opacity: visible ? 1 : 0,
      }}>
        {THREATS[index]}
      </span>
      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:.75} 50%{transform:scale(1.8);opacity:0} }`}</style>
    </div>
  );
}

// ── Scan demo card ─────────────────────────────────────────────────────────

function ScanDemoCard() {
  const findings = [
    { id: "jb_001", cat: "Jailbreak", sev: "CRITICAL", status: "FAILED" },
    { id: "pi_001", cat: "Prompt Injection", sev: "CRITICAL", status: "FAILED" },
    { id: "rb_003", cat: "Roleplay Bypass", sev: "CRITICAL", status: "FAILED" },
    { id: "ex_003", cat: "Exfiltration", sev: "HIGH", status: "FAILED" },
    { id: "cp_003", cat: "Context Poisoning", sev: "CRITICAL", status: "PASSED" },
  ];

  return (
    <div style={{
      background: "rgba(0,0,0,0.7)", border: "1px solid #27272a",
      borderRadius: "16px", overflow: "hidden", backdropFilter: "blur(12px)",
    }}>
      {/* Terminal bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "12px 16px", borderBottom: "1px solid #27272a",
        background: "rgba(0,0,0,0.4)",
      }}>
        <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444", opacity: 0.7 }}/>
        <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }}/>
        <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e", opacity: 0.7 }}/>
        <span style={{ marginLeft: "12px", fontSize: "12px", fontFamily: "monospace", color: "#52525b" }}>
          spectre-scanner — GPT-4 security audit
        </span>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525b", marginBottom: "4px" }}>
              SCAN COMPLETE · api.openai.com/v1/chat/completions
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "12px", color: "#4ade80" }}>
              ✓ 42 attacks executed · 3m 14s
            </p>
          </div>
          {/* Grade badge - matching dashboard style */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "12px",
              background: "rgba(127,29,29,0.5)", border: "2px solid rgba(239,68,68,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "#f87171", fontFamily: "inherit" }}>F</span>
            </div>
            <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525b", marginTop: "4px" }}>44/100</p>
          </div>
        </div>

        {/* Severity summary row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px",
        }}>
          {[
            { label: "CRITICAL", val: "15", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
            { label: "HIGH", val: "21", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
            { label: "MEDIUM", val: "7", color: "#eab308", bg: "rgba(234,179,8,0.08)" },
            { label: "LOW", val: "0", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.color}22`,
              borderRadius: "8px", padding: "8px", textAlign: "center",
            }}>
              <p style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: s.color }}>{s.val}</p>
              <p style={{ fontFamily: "monospace", fontSize: "9px", color: "#52525b", marginTop: "2px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Findings table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "64px 1fr 80px 72px",
            padding: "4px 12px", marginBottom: "2px",
          }}>
            {["ID", "CATEGORY", "SEVERITY", "STATUS"].map(h => (
              <span key={h} style={{ fontFamily: "monospace", fontSize: "9px", color: "#3f3f46", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {findings.map((f) => (
            <div key={f.id} style={{
              display: "grid", gridTemplateColumns: "64px 1fr 80px 72px",
              background: "rgba(39,39,42,0.5)", borderRadius: "8px",
              padding: "10px 12px", alignItems: "center",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#52525b" }}>{f.id}</span>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#a1a1aa" }}>{f.cat}</span>
              <span style={{
                fontFamily: "monospace", fontSize: "11px", fontWeight: 600,
                color: f.sev === "CRITICAL" ? "#ef4444" : "#f97316",
              }}>{f.sev}</span>
              <span style={{
                fontFamily: "monospace", fontSize: "10px", fontWeight: 600,
                color: f.status === "FAILED" ? "#ef4444" : "#22c55e",
                background: f.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                padding: "2px 6px", borderRadius: "4px", display: "inline-block",
              }}>{f.status}</span>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #27272a",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#f87171" }}>
            ⚠ 22 vulnerabilities found across 42 attacks
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#3f3f46" }}>PDF report generated</span>
        </div>
      </div>
    </div>
  );
}

// ── Threat categories with hover tooltips ─────────────────────────────────

const THREAT_CATS = [
  {
    label: "Prompt injection",
    count: "15 attacks",
    tooltip: "Detects attempts to override your system prompt with malicious instructions embedded in user input. Catches direct overrides, nested injections, delimiter confusion, and multilingual bypass attempts.",
  },
  {
    label: "Jailbreak",
    count: "10 attacks",
    tooltip: "Identifies known jailbreak patterns including DAN, STAN, developer mode activation, sudo escalation, fictional universe bypass, and token manipulation designed to remove safety guardrails.",
  },
  {
    label: "Data exfiltration",
    count: "8 attacks",
    tooltip: "Catches attempts to extract training data, system configuration, API keys, RAG knowledge base content, and user data from your LLM's context window.",
  },
  {
    label: "Context poisoning",
    count: "5 attacks",
    tooltip: "Detects false memory injection, authority impersonation (fake Anthropic/OpenAI messages), session state manipulation, and gradual persona drift designed to corrupt model behavior over time.",
  },
  {
    label: "Roleplay bypass",
    count: "5 attacks",
    tooltip: "Identifies character capture, villain personas, AI simulator attacks, and fictional framing used to extract restricted content under the guise of creative or educational requests.",
  },
];

function ThreatCategory({ item }: { item: typeof THREAT_CATS[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: hovered ? "rgba(124,58,237,0.08)" : "rgba(9,9,11,0.6)",
        border: `1px solid ${hovered ? "rgba(124,58,237,0.3)" : "#27272a"}`,
        padding: "12px 16px", borderRadius: "12px", backdropFilter: "blur(8px)",
        cursor: "default", transition: "all 0.2s ease",
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }}/>
        <span style={{ fontSize: "14px", color: "#d4d4d8", fontWeight: 500 }}>{item.label}</span>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525b" }}>{item.count}</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(9,9,11,0.95)", border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "10px", padding: "12px 14px",
          width: "280px", zIndex: 50,
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
        }}>
          <p style={{ fontSize: "12px", color: "#a1a1aa", lineHeight: 1.6 }}>{item.tooltip}</p>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)",
            width: "8px", height: "8px", background: "rgba(9,9,11,0.95)",
            border: "1px solid rgba(124,58,237,0.2)", borderTop: "none", borderLeft: "none",
            transform: "translateX(-50%) rotate(45deg)",
          }}/>
        </div>
      )}
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "PILOT",
    price: "Free",
    period: "",
    badge: null,
    desc: "14-day trial. No credit card required. For teams evaluating AI security for the first time.",
    features: [
      "10 scans during trial",
      "Quick attack suite (critical only)",
      "PDF security reports",
      "Spectre Shield SDK access",
      "10,000 Shield inspections",
      "Community support",
    ],
    cta: "Start free trial",
    highlight: false,
    note: "Trial expires after 14 days",
  },
  {
    name: "STARTER",
    price: "$499",
    period: "/month",
    badge: "Most popular",
    desc: "For engineering teams shipping LLM applications to production and needing ongoing security.",
    features: [
      "Unlimited scans",
      "Full 43-attack suite",
      "PDF reports + remediation guide",
      "Shield SDK — unlimited inspections",
      "Policy management dashboard",
      "Violation log + CSV export",
      "Slack & webhook alerts",
      "Priority email support",
    ],
    cta: "Start free trial",
    highlight: true,
    note: "Billed monthly · cancel anytime",
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "",
    badge: null,
    desc: "For organizations with compliance mandates, audit requirements, and enterprise scale.",
    features: [
      "Everything in Starter",
      "Custom attack library",
      "OWASP LLM Top 10 reports",
      "NIST AI RMF mapping",
      "SSO / SAML",
      "Dedicated deployment",
      "99.9% SLA guarantee",
      "Dedicated security engineer",
    ],
    cta: "Contact us",
    highlight: false,
    note: "Volume discounts available",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#060608", color: "#f4f4f5", overflowX: "hidden" }}>
      <GridBackground />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(6,6,8,0.85)", backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto", padding: "0 24px",
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed"/>
              <circle cx="10" cy="13" r="1.5" fill="#060608"/>
              <circle cx="18" cy="13" r="1.5" fill="#060608"/>
            </svg>
            <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px" }}>
              Spectre<span style={{ color: "#7c3aed" }}> Security</span>
            </span>
          </div>

          {/* Right side nav */}
          <div className="sp-nav-links">
            <a href="#how-it-works" style={{ fontSize: "14px", color: "#71717a", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}>
              How it works
            </a>
            <a href="#pricing" style={{ fontSize: "14px", color: "#71717a", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}>
              Pricing
            </a>
            <Link href="/signup" style={{
              fontSize: "14px", fontWeight: 600, color: "white",
              background: "#7c3aed", padding: "8px 18px", borderRadius: "8px",
              textDecoration: "none",
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "140px", paddingBottom: "80px", paddingLeft: "24px", paddingRight: "24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
          <ThreatTicker />

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            color: "#ffffff",
            marginBottom: "24px",
            textShadow: "0 0 60px rgba(124,58,237,0.3)",
          }}>
            Your AI app is vulnerable.
            <br />
            <span style={{ color: "#7c3aed" }}>We&apos;ll prove it — then fix it.</span>
          </h1>

          <p style={{
            fontSize: "22px", color: "#a1a1aa", fontWeight: 600,
            letterSpacing: "-0.5px", marginBottom: "16px",
          }}>
            The average LLM app scores Grade F. What does yours score?
          </p>

          <p style={{
            fontSize: "16px", color: "#71717a", maxWidth: "560px",
            margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            We scanned a raw GPT-4 endpoint and found 22 critical vulnerabilities in 4 minutes.
            Run your first scan free — no credit card required.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Link href="/signup" style={{
              fontSize: "15px", fontWeight: 600, color: "white",
              background: "#7c3aed", padding: "14px 28px", borderRadius: "10px",
              textDecoration: "none",
            }}>
              Start for free →
            </Link>
            <a href="#how-it-works" style={{
              fontSize: "15px", fontWeight: 500, color: "#71717a",
              padding: "14px 28px", borderRadius: "10px",
              border: "1px solid #27272a", textDecoration: "none",
            }}>
              See how it works
            </a>
          </div>
          <p style={{ fontSize: "13px", color: "#3f3f46" }}>14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* Responsive overrides */}
      <style>{`
        .sp-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:32px; text-align:center; }
        .sp-pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .sp-steps-step { display:flex; gap:28px; align-items:flex-start; }
        .sp-nav-links { display:flex; align-items:center; gap:32px; }
        @media (max-width:768px) {
          .sp-stats-grid { grid-template-columns:repeat(2,1fr); gap:20px; }
          .sp-pricing-grid { grid-template-columns:1fr; max-width:400px; margin:0 auto; }
          .sp-steps-step { flex-direction:column; gap:12px; }
          .sp-nav-links a:not(:last-child) { display:none; }
        }
      `}</style>

      {/* Stats */}
      <section style={{
        padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)",
      }}>
        <div className="sp-stats-grid" style={{ maxWidth: "800px", margin: "0 auto" }}>
          {[
            { value: "43", label: "Attack vectors" },
            { value: "67", label: "Detection rules" },
            { value: "<30ms", label: "Inspection latency" },
            { value: "Grade F", label: "Raw GPT-4 score" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: "32px", fontWeight: 700, color: "#7c3aed", lineHeight: 1, marginBottom: "6px" }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo scan */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p style={{
            fontSize: "11px", fontFamily: "monospace", color: "#52525b",
            textAlign: "center", marginBottom: "16px",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Live scan result — raw GPT-4 endpoint, no system prompt
          </p>
          <ScanDemoCard />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(124,58,237,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              How it works
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-1px", color: "#f4f4f5", lineHeight: 1.1 }}>
              From zero to secured
              <br /><span style={{ color: "#52525b" }}>in under an hour</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                num: "01", color: "#7c3aed", tag: "Pre-deployment",
                title: "Point Scanner at your LLM endpoint",
                desc: "Enter your LLM endpoint URL and API key in the Spectre dashboard. Scanner immediately begins firing 43 adversarial attacks across 5 threat categories — prompt injection, jailbreaks, data exfiltration, context poisoning, and roleplay bypass. Each attack is crafted to mirror real-world attack patterns used by adversaries targeting production LLM applications.",
              },
              {
                num: "02", color: "#0ea5e9", tag: "Minutes not days",
                title: "Get a security grade with actionable findings",
                desc: "Every attack response is classified using keyword matching and an LLM judge calibrated for security evaluation. Your endpoint receives a score from 0–100, a letter grade (A through F), and a severity breakdown by category. A branded PDF report is generated automatically — formatted for sharing with your security team or CISO. The full scan typically completes in 3–5 minutes.",
              },
              {
                num: "03", color: "#10b981", tag: "Runtime protection",
                title: "Deploy Shield to protect production traffic",
                desc: "Install the Spectre Shield Python SDK with a single import. Every prompt sent to your LLM and every response returned is inspected in real time against 67 detection rules — covering credential leakage, injection attempts, jailbreak patterns, and custom DLP policies you define. Violations are logged, blocked, or redacted based on your policy configuration. Inspection latency is under 30ms p95.",
              },
            ].map((step) => (
              <div key={step.num} className="sp-steps-step" style={{
                background: "rgba(9,9,11,0.6)", border: "1px solid #1c1c1e",
                borderRadius: "16px", padding: "28px",
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1c1c1e")}
              >
                <span style={{
                  fontSize: "42px", fontWeight: 700, fontFamily: "monospace",
                  color: step.color, opacity: 0.25, lineHeight: 1, flexShrink: 0,
                }}>{step.num}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.3px" }}>{step.title}</h3>
                    <span style={{
                      fontSize: "10px", fontFamily: "monospace", fontWeight: 600,
                      padding: "3px 8px", borderRadius: "999px",
                      color: step.color, border: `1px solid ${step.color}30`, background: `${step.color}10`,
                    }}>{step.tag}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.75 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat categories */}
      <section style={{
        padding: "64px 24px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(0,0,0,0.2)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "28px" }}>
            Threat categories detected · hover to learn more
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
            {THREAT_CATS.map(item => <ThreatCategory key={item.label} item={item} />)}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(124,58,237,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Pricing
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-1px", color: "#f4f4f5" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: "#71717a", marginTop: "12px", fontSize: "16px" }}>
              Start free. Scale when you're ready.
            </p>
          </div>

          <div className="sp-pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                position: "relative",
                background: plan.highlight
                  ? "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(14,165,233,0.06) 100%)"
                  : "rgba(9,9,11,0.6)",
                border: plan.highlight ? "1px solid rgba(124,58,237,0.35)" : "1px solid #1c1c1e",
                borderRadius: "20px", padding: "28px",
                display: "flex", flexDirection: "column",
                backdropFilter: "blur(8px)",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)" }}>
                    <span style={{
                      background: "#7c3aed", color: "white",
                      fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px",
                    }}>{plan.badge}</span>
                  </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontFamily: "monospace", fontSize: "10px", color: plan.highlight ? "#a78bfa" : "#52525b", letterSpacing: "0.1em", marginBottom: "8px" }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "40px", fontWeight: 700, color: "#f4f4f5", lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: "14px", color: "#71717a" }}>{plan.period}</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.6 }}>{plan.desc}</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#d4d4d8" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <path d="M3 8l3.5 3.5L13 4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <div>
                  <Link href="/signup" style={{
                    display: "block", textAlign: "center", fontSize: "14px", fontWeight: 600,
                    padding: "12px", borderRadius: "10px", textDecoration: "none",
                    background: plan.highlight ? "#7c3aed" : "transparent",
                    color: plan.highlight ? "white" : "#71717a",
                    border: plan.highlight ? "none" : "1px solid #3f3f46",
                  }}>
                    {plan.cta}
                  </Link>
                  {plan.note && (
                    <p style={{ textAlign: "center", fontSize: "11px", color: "#3f3f46", marginTop: "8px" }}>{plan.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#3f3f46", marginTop: "24px" }}>
            All plans include the Spectre Shield SDK and detection engine. No hidden fees.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: "#f4f4f5", marginBottom: "16px", lineHeight: 1.2 }}>
            Your LLM has vulnerabilities.
            <br /><span style={{ color: "#7c3aed" }}>Find them before attackers do.</span>
          </h2>
          <p style={{ color: "#71717a", marginBottom: "32px", fontSize: "16px" }}>
            Run your first scan free. No credit card required.
          </p>
          <Link href="/signup" style={{
            display: "inline-block", fontSize: "15px", fontWeight: 600,
            color: "white", background: "#7c3aed",
            padding: "14px 32px", borderRadius: "10px", textDecoration: "none",
          }}>
            Start free trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px 24px" }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.5"/>
            </svg>
            <span style={{ fontSize: "12px", color: "#3f3f46" }}>Spectre Security · AI Runtime Protection · v0.1.0-mvp</span>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {[["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["Sign in", "/login"]].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: "12px", color: "#3f3f46", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#71717a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#3f3f46")}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
