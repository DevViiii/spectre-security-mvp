"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ── Animated background ────────────────────────────────────────────────────

function Background() {
  return (
    <>
      <style>{`
        @keyframes auroraPulse {
          0% { transform: translate(-3%,-2%) scale(1) rotate(0deg); }
          50% { transform: translate(2%,-1%) scale(1.08) rotate(12deg); }
          100% { transform: translate(0%,4%) scale(1.03) rotate(-10deg); }
        }
        @keyframes scanMove {
          0% { top: -2px; }
          100% { top: 100vh; }
        }
        @keyframes breathe {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        @keyframes floatBadge {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ping {
          0%,100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes tickerFade {
          0% { opacity: 0; transform: translateY(4px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-link {
          color: #9fb1d1;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #fff; }
        .feature-card-hover {
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .feature-card-hover:hover {
          transform: translateY(-6px);
          border-color: rgba(110,242,255,0.2) !important;
        }
        .price-card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .price-card-hover:hover {
          transform: translateY(-6px);
        }
        .btn-primary-glow:hover {
          box-shadow: 0 0 24px rgba(110,242,255,0.3), 0 0 48px rgba(79,140,255,0.2);
        }
        .testimonial-track {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: scroll 35s linear infinite;
        }
        .testimonial-track:hover { animation-play-state: paused; }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Aurora glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        filter: "blur(60px)", opacity: 0.5,
      }}>
        <div style={{
          position: "absolute", inset: "-20%",
          background: "radial-gradient(closest-side, rgba(110,242,255,0.18), transparent 70%), radial-gradient(closest-side, rgba(138,107,255,0.18), transparent 68%)",
          animation: "auroraPulse 18s ease-in-out infinite alternate",
        }}/>
      </div>

      {/* Grid */}
      <svg style={{ position: "fixed", inset: 0, opacity: 0.04, pointerEvents: "none", zIndex: 0, width: "100%", height: "100%" }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6ef2ff" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Scanline */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(110,242,255,0.4), transparent)",
        animation: "scanMove 10s linear infinite",
        pointerEvents: "none", zIndex: 0, top: 0,
      }}/>

      {/* Volumetric */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(800px 380px at 50% 18%, rgba(110,242,255,0.1), transparent 60%), radial-gradient(1000px 400px at 55% 22%, rgba(138,107,255,0.06), transparent 62%)",
        animation: "breathe 10s ease-in-out infinite",
      }}/>

      {/* Scanlines texture */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.04,
        background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0) 2px, transparent 4px, transparent 8px)",
        backgroundSize: "100% 8px",
      }}/>
    </>
  );
}

// ── Threat ticker ──────────────────────────────────────────────────────────

const THREATS = [
  "Prompt injection", "DAN jailbreak", "System prompt extraction",
  "Credential leakage", "Context poisoning", "Roleplay bypass",
  "Data exfiltration", "Authority impersonation", "Token smuggling",
];

function ThreatTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % THREATS.length), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "12px",
      background: "rgba(9,20,36,0.56)", border: "1px solid rgba(255,255,255,0.08)",
      padding: "8px 16px", borderRadius: "999px", backdropFilter: "blur(12px)",
      marginBottom: "28px",
    }}>
      <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#6ef2ff", opacity: 0.75, animation: "ping 1.5s ease-in-out infinite" }}/>
        <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#6ef2ff" }}/>
      </span>
      <span style={{ fontSize: "11px", color: "#9fb1d1", fontFamily: "monospace", letterSpacing: "0.05em" }}>DEFENDING AGAINST</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#6ef2ff", fontFamily: "monospace", minWidth: "200px" }}>
        {THREATS[index]}
      </span>
    </div>
  );
}

// ── Scan demo card ─────────────────────────────────────────────────────────

function ScanDemoCard() {
  const findings = [
    { id: "jb_001", cat: "Jailbreak", sev: "CRITICAL", status: "FAILED", sevColor: "#ef4444" },
    { id: "pi_001", cat: "Prompt Injection", sev: "CRITICAL", status: "FAILED", sevColor: "#ef4444" },
    { id: "rb_003", cat: "Roleplay Bypass", sev: "CRITICAL", status: "FAILED", sevColor: "#ef4444" },
    { id: "ex_003", cat: "Exfiltration", sev: "HIGH", status: "FAILED", sevColor: "#f97316" },
    { id: "cp_003", cat: "Context Poisoning", sev: "CRITICAL", status: "PASSED", sevColor: "#ef4444" },
  ];

  return (
    <div style={{
      background: "rgba(6,6,8,0.85)", border: "1px solid rgba(110,242,255,0.15)",
      borderRadius: "16px", overflow: "hidden", backdropFilter: "blur(16px)",
      boxShadow: "0 0 40px rgba(110,242,255,0.06), 0 20px 60px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.3)",
      }}>
        {["#ef4444","#f59e0b","#22c55e"].map((c,i) => (
          <span key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, opacity: 0.7 }}/>
        ))}
        <span style={{ marginLeft: "8px", fontSize: "11px", fontFamily: "monospace", color: "#52525b" }}>
          spectre-scanner — GPT-4 security audit
        </span>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#52525b", margin: "0 0 4px" }}>
              SCAN COMPLETE · api.openai.com/v1/chat/completions
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "12px", color: "#4ade80", margin: 0 }}>
              ✓ 42 attacks executed · 3m 14s
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "12px",
              background: "rgba(127,29,29,0.4)", border: "2px solid rgba(239,68,68,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "26px", fontWeight: 800, color: "#f87171" }}>F</span>
            </div>
            <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#52525b", margin: "4px 0 0" }}>44/100</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "14px" }}>
          {[
            { label: "CRITICAL", val: "15", color: "#ef4444" },
            { label: "HIGH", val: "21", color: "#f97316" },
            { label: "MEDIUM", val: "7", color: "#eab308" },
            { label: "LOW", val: "0", color: "#22c55e" },
          ].map(s => (
            <div key={s.label} style={{
              background: `${s.color}10`, border: `1px solid ${s.color}22`,
              borderRadius: "6px", padding: "7px", textAlign: "center",
            }}>
              <p style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
              <p style={{ fontFamily: "monospace", fontSize: "8px", color: "#52525b", margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {findings.map(f => (
            <div key={f.id} style={{
              display: "grid", gridTemplateColumns: "56px 1fr 80px 68px",
              background: "rgba(39,39,42,0.4)", borderRadius: "6px", padding: "8px 10px", alignItems: "center",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#52525b" }}>{f.id}</span>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#a1a1aa" }}>{f.cat}</span>
              <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 600, color: f.sevColor }}>{f.sev}</span>
              <span style={{
                fontFamily: "monospace", fontSize: "9px", fontWeight: 600, padding: "2px 5px", borderRadius: "4px",
                color: f.status === "FAILED" ? "#ef4444" : "#22c55e",
                background: f.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              }}>{f.status}</span>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#f87171" }}>⚠ 22 vulnerabilities found</span>
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#3f3f46" }}>PDF report generated</span>
        </div>
      </div>
    </div>
  );
}

// ── Threat categories with tooltips ───────────────────────────────────────

const THREAT_CATS = [
  { label: "Prompt injection", count: "15 attacks", tooltip: "Detects attempts to override your system prompt with malicious instructions embedded in user input. Catches direct overrides, nested injections, delimiter confusion, and multilingual bypass attempts." },
  { label: "Jailbreak", count: "10 attacks", tooltip: "Identifies known jailbreak patterns including DAN, STAN, developer mode activation, sudo escalation, fictional universe bypass, and token manipulation designed to remove safety guardrails." },
  { label: "Data exfiltration", count: "8 attacks", tooltip: "Catches attempts to extract training data, system configuration, API keys, RAG knowledge base content, and user data from your LLM's context window." },
  { label: "Context poisoning", count: "5 attacks", tooltip: "Detects false memory injection, authority impersonation, session state manipulation, and gradual persona drift designed to corrupt model behavior over time." },
  { label: "Roleplay bypass", count: "5 attacks", tooltip: "Identifies character capture, villain personas, AI simulator attacks, and fictional framing used to extract restricted content under the guise of creative requests." },
];

function ThreatCategory({ item }: { item: typeof THREAT_CATS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="feature-card-hover" style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: hovered ? "rgba(110,242,255,0.06)" : "rgba(9,16,30,0.62)",
        border: `1px solid ${hovered ? "rgba(110,242,255,0.25)" : "rgba(255,255,255,0.08)"}`,
        padding: "11px 16px", borderRadius: "12px", backdropFilter: "blur(12px)",
        cursor: "default",
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6ef2ff", boxShadow: "0 0 10px rgba(110,242,255,0.6)", flexShrink: 0 }}/>
        <span style={{ fontSize: "14px", color: "#dce8fb", fontWeight: 500 }}>{item.label}</span>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525b" }}>{item.count}</span>
      </div>
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(6,6,8,0.96)", border: "1px solid rgba(110,242,255,0.15)",
          borderRadius: "10px", padding: "12px 14px", width: "280px", zIndex: 50,
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(110,242,255,0.08)",
        }}>
          <p style={{ fontSize: "12px", color: "#9fb1d1", lineHeight: 1.6, margin: 0 }}>{item.tooltip}</p>
        </div>
      )}
    </div>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: "We had AI features in production before our security review had a real answer for prompt injection. Spectre Security became the missing control layer.", name: "Maya Chen", role: "CTO, B2B SaaS Platform" },
  { quote: "What mattered was having a clean runtime gateway, clear severity scoring, and audit-friendly logs our security team could actually trust.", name: "Daniel Ross", role: "Head of Security, Enterprise AI" },
  { quote: "Most AI security tools feel like research projects. Spectre Security felt deployable. Clear controls without slowing our product team down.", name: "Aisha Patel", role: "Founder, Workflow Automation" },
  { quote: "RAG leakage and prompt extraction were the issues our buyers kept asking about. Having a runtime defense story changed our enterprise conversations.", name: "Noah Bennett", role: "VP Engineering, AI Search Product" },
  { quote: "The best part was usability. Developers could see exactly what matched, why it was risky, and what action was taken. Adoption was easy.", name: "Sofia Laurent", role: "Platform Lead, AI Infrastructure" },
];

// ── Pricing ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "PILOT", price: "Free", period: "", featured: false,
    desc: "14-day trial. No credit card. For teams evaluating AI security.",
    features: ["10 scans during trial", "Quick attack suite (critical only)", "PDF security reports", "Shield SDK access", "10,000 Shield inspections", "Community support"],
    cta: "Start free trial", note: "Trial expires after 14 days",
  },
  {
    name: "STARTER", price: "$499", period: "/month", featured: false,
    desc: "For engineering teams shipping LLM applications to production.",
    features: ["Unlimited scans", "Full 43-attack suite", "PDF reports + remediation guide", "Shield SDK — unlimited inspections", "Policy management dashboard", "Violation log + CSV export", "Slack & webhook alerts", "Priority support"],
    cta: "Start free trial", note: "Billed monthly · cancel anytime",
  },
  {
    name: "GROWTH", price: "$1,999", period: "/month", featured: true,
    desc: "For SaaS companies with AI products that need a stronger security story.",
    features: ["Everything in Starter", "Advanced policy controls", "OWASP LLM Top 10 reports", "NIST AI RMF mapping", "Workspace and app segmentation", "Audit-ready compliance reports", "Priority onboarding", "Dedicated security review"],
    cta: "Start protecting AI", note: "Most popular for enterprise pilots",
  },
  {
    name: "ENTERPRISE", price: "Custom", period: "", featured: false,
    desc: "For organizations with compliance requirements and enterprise scale.",
    features: ["Everything in Growth", "Custom attack library", "SSO / SAML", "Dedicated deployment", "SLA guarantee", "Custom compliance frameworks", "Dedicated security engineer"],
    cta: "Contact us", note: "Volume discounts available",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#03040a", color: "#edf4ff", overflowX: "hidden" }}>
      <Background />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 20,
        backdropFilter: "blur(16px)",
        background: "linear-gradient(180deg, rgba(3,8,16,0.72), rgba(3,8,16,0.28))",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(110,242,255,0.9), rgba(79,140,255,0.9) 45%, rgba(138,107,255,0.9))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(110,242,255,0.3)",
            }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#030810" }}>S</span>
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.3px" }}>
              Spectre <span style={{ color: "#6ef2ff" }}>Security</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link href="/signup" style={{
              padding: "10px 18px", borderRadius: "999px",
              border: "1px solid rgba(110,242,255,0.28)",
              background: "linear-gradient(180deg, rgba(11,26,44,0.82), rgba(8,18,32,0.72))",
              color: "#edf4ff", fontSize: "14px", fontWeight: 600, textDecoration: "none",
              boxShadow: "0 0 16px rgba(110,242,255,0.1)",
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "120px", paddingBottom: "60px", paddingLeft: "24px", paddingRight: "24px", zIndex: 2 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <ThreatTicker />

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 800,
            lineHeight: 1.0, letterSpacing: "-3px", margin: "0 0 20px",
          }}>
            <span style={{
              background: "linear-gradient(90deg, #fff 0%, #dff8ff 30%, #8fdfff 60%, #a4b0ff 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Your AI app is vulnerable.
            </span>
            <br />
            <span style={{ color: "#6ef2ff", WebkitTextFillColor: "#6ef2ff" }}>
              We'll prove it — then fix it.
            </span>
          </h1>

          <p style={{ fontSize: "20px", fontWeight: 600, color: "#c5d8ff", marginBottom: "12px", letterSpacing: "-0.3px" }}>
            The average LLM app scores Grade F. What does yours score?
          </p>

          <p style={{ fontSize: "16px", color: "#9fb1d1", maxWidth: "540px", margin: "0 auto 36px", lineHeight: 1.7 }}>
            We scanned a raw GPT-4 endpoint and found 22 critical vulnerabilities in 4 minutes.
            Run your first scan free — no credit card required.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
            <Link href="/signup" className="btn-primary-glow" style={{
              fontSize: "15px", fontWeight: 700, color: "#fff",
              padding: "15px 28px", borderRadius: "999px",
              background: "linear-gradient(135deg, rgba(110,242,255,0.22), rgba(79,140,255,0.18)), linear-gradient(180deg, rgba(16,34,56,0.95), rgba(9,20,34,0.95))",
              border: "1px solid rgba(110,242,255,0.38)",
              textDecoration: "none", display: "inline-block",
              transition: "transform 0.2s",
            }}>
              Start for free →
            </Link>
            <a href="#how-it-works" style={{
              fontSize: "15px", fontWeight: 500, color: "#9fb1d1",
              padding: "15px 28px", borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", textDecoration: "none",
            }}>
              See how it works
            </a>
          </div>
          <p style={{ fontSize: "12px", color: "#3f3f46" }}>14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* Scan demo */}
      <section style={{ padding: "0 24px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#52525b", textAlign: "center", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Live scan result — raw GPT-4 endpoint · no system prompt
          </p>
          <ScanDemoCard />
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px", textAlign: "center" }}>
          {[
            { value: "43", label: "Attack vectors" },
            { value: "67", label: "Detection rules" },
            { value: "<30ms", label: "Inspection latency" },
            { value: "Grade F", label: "Raw GPT-4 score" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, letterSpacing: "-1px", color: "#6ef2ff", marginBottom: "6px", textShadow: "0 0 20px rgba(110,242,255,0.3)" }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "80px 24px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(110,242,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>How it works</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-1.5px", margin: "0 0 12px" }}>
              From zero to secured
              <br /><span style={{ color: "#52525b" }}>in under an hour</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { num: "01", color: "#6ef2ff", tag: "Pre-deployment", title: "Point Scanner at your LLM endpoint", desc: "Enter your LLM endpoint URL and API key. Scanner fires 43 adversarial attacks across 5 threat categories — prompt injection, jailbreaks, data exfiltration, context poisoning, and roleplay bypass. Each attack mirrors real-world patterns used against production LLM applications." },
              { num: "02", color: "#4f8cff", tag: "Minutes not days", title: "Get a security grade with actionable findings", desc: "Every attack response is classified using keyword matching and an LLM judge. Your endpoint receives a score from 0–100, a letter grade (A through F), and a severity breakdown. A branded PDF report with OWASP LLM Top 10 mapping and remediation steps is generated automatically." },
              { num: "03", color: "#6cffc6", tag: "Runtime protection", title: "Deploy Shield to protect production traffic", desc: "Install the Shield Python SDK with a single import. Every prompt and response is inspected in real time against 67 detection rules — credential leakage, injection attempts, jailbreak patterns, and your custom DLP policies. Violations are blocked, redacted, or logged. Under 30ms p95." },
            ].map(step => (
              <div key={step.num}
                className="feature-card-hover"
                style={{
                  display: "flex", gap: "24px", alignItems: "flex-start",
                  background: "rgba(9,16,30,0.62)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px", padding: "28px", backdropFilter: "blur(12px)",
                }}
              >
                <span style={{ fontSize: "40px", fontWeight: 800, fontFamily: "monospace", color: step.color, opacity: 0.25, lineHeight: 1, flexShrink: 0 }}>{step.num}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.3px", margin: 0 }}>{step.title}</h3>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", color: step.color, border: `1px solid ${step.color}30`, background: `${step.color}10` }}>{step.tag}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#9fb1d1", lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat categories */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>
            Threat categories detected · hover to learn more
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
            {THREAT_CATS.map(item => <ThreatCategory key={item.label} item={item} />)}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "80px 0", position: "relative", zIndex: 2, overflow: "hidden" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(110,242,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Voices</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>
            Built for teams shipping AI
          </h2>
        </div>
        <div style={{ overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
          <div className="testimonial-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} style={{
                minWidth: "360px", maxWidth: "380px",
                background: "rgba(9,16,30,0.62)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "24px", backdropFilter: "blur(12px)",
                flexShrink: 0,
              }}>
                <p style={{ fontSize: "14px", color: "#dce8fb", lineHeight: 1.75, margin: "0 0 18px" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(110,242,255,0.8), rgba(79,140,255,0.9), rgba(138,107,255,0.8))",
                    boxShadow: "0 0 16px rgba(110,242,255,0.15)",
                  }}/>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f5", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: "12px", color: "#9fb1d1", margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 24px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(110,242,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-1.5px", margin: "0 0 12px" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: "#9fb1d1", fontSize: "16px", margin: 0 }}>Start free. Scale when you're ready.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            {PLANS.map(plan => (
              <div key={plan.name} className="price-card-hover" style={{
                position: "relative",
                background: plan.featured
                  ? "linear-gradient(135deg, rgba(110,242,255,0.08) 0%, rgba(79,140,255,0.06) 50%, rgba(138,107,255,0.06) 100%)"
                  : "rgba(9,16,30,0.62)",
                border: plan.featured ? "1px solid rgba(110,242,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: "18px", padding: "24px",
                backdropFilter: "blur(12px)",
                display: "flex", flexDirection: "column",
                boxShadow: plan.featured ? "0 0 40px rgba(110,242,255,0.06)" : "none",
              }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
                    <span style={{
                      background: "linear-gradient(135deg, #6ef2ff, #4f8cff)",
                      color: "#030810", fontSize: "10px", fontWeight: 700,
                      padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace",
                    }}>MOST POPULAR</span>
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.1em", color: plan.featured ? "#6ef2ff" : "#52525b", margin: "0 0 8px" }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "clamp(28px,3vw,38px)", fontWeight: 800, letterSpacing: "-1px", color: "#f4f4f5", lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: "13px", color: "#9fb1d1" }}>{plan.period}</span>}
                  </div>
                  <p style={{ fontSize: "12px", color: "#9fb1d1", lineHeight: 1.6, margin: 0 }}>{plan.desc}</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#dce8fb" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #6ef2ff, #8a6bff)", boxShadow: "0 0 8px rgba(110,242,255,0.4)", flexShrink: 0, marginTop: "3px" }}/>
                      {f}
                    </li>
                  ))}
                </ul>

                <div>
                  <Link href="/signup" style={{
                    display: "block", textAlign: "center", fontSize: "13px", fontWeight: 600,
                    padding: "12px", borderRadius: "10px", textDecoration: "none",
                    background: plan.featured ? "linear-gradient(135deg, rgba(110,242,255,0.2), rgba(79,140,255,0.15))" : "transparent",
                    color: plan.featured ? "#6ef2ff" : "#9fb1d1",
                    border: plan.featured ? "1px solid rgba(110,242,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                    {plan.cta}
                  </Link>
                  {plan.note && <p style={{ textAlign: "center", fontSize: "10px", color: "#3f3f46", marginTop: "8px", fontFamily: "monospace" }}>{plan.note}</p>}
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#3f3f46", marginTop: "20px" }}>
            All plans include the Spectre Shield SDK and detection engine. No hidden fees.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", position: "relative", zIndex: 2 }}>
        <div style={{
          maxWidth: "800px", margin: "0 auto",
          background: "rgba(9,16,30,0.62)", border: "1px solid rgba(110,242,255,0.15)",
          borderRadius: "20px", padding: "48px 40px", backdropFilter: "blur(16px)",
          textAlign: "center", boxShadow: "0 0 60px rgba(110,242,255,0.04)",
        }}>
          <h2 style={{ fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, letterSpacing: "-1px", margin: "0 0 14px" }}>
            Your LLM has vulnerabilities.
            <br /><span style={{ color: "#6ef2ff" }}>Find them before attackers do.</span>
          </h2>
          <p style={{ color: "#9fb1d1", fontSize: "16px", marginBottom: "28px" }}>
            Run your first scan free. No credit card required.
          </p>
          <Link href="/signup" style={{
            display: "inline-block", fontSize: "15px", fontWeight: 700, color: "#030810",
            padding: "15px 32px", borderRadius: "999px",
            background: "linear-gradient(135deg, #6ef2ff, #4f8cff)",
            textDecoration: "none", boxShadow: "0 0 24px rgba(110,242,255,0.25)",
          }}>
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px 24px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, rgba(110,242,255,0.6), rgba(138,107,255,0.6))" }}/>
            <span style={{ fontSize: "13px", color: "#52525b" }}>Spectre Security · AI Runtime Protection · v0.1.0-mvp</span>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {[["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["Sign in", "/login"]].map(([label, href]) => (
              <a key={label} href={href} className="nav-link" style={{ fontSize: "12px" }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
