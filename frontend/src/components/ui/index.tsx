// Shared UI primitives for the dark minimal dashboard theme

import { clsx } from "clsx";

// ── Card ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#0d0d11",
        border: "1px solid #1a1a1f",
        borderRadius: "10px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <Card style={{ padding: "16px" }}>
      <p style={{
        fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "#3f3f46", marginBottom: "8px",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px",
        color: valueColor ?? "#f0f0f2", lineHeight: 1,
      }}>
        {value}
      </p>
    </Card>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────

type BadgeVariant = "completed" | "running" | "pending" | "failed" | "error" |
  "block" | "redact" | "alert" | "allow" |
  "critical" | "high" | "medium" | "low";

const BADGE_STYLES: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  completed:  { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)" },
  running:    { color: "#6ef2ff", bg: "rgba(110,242,255,0.08)", border: "rgba(110,242,255,0.2)" },
  pending:    { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)" },
  failed:     { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  error:      { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.2)" },
  block:      { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  redact:     { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)" },
  alert:      { color: "#6ef2ff", bg: "rgba(110,242,255,0.08)", border: "rgba(110,242,255,0.2)" },
  allow:      { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)" },
  critical:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  high:       { color: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.2)" },
  medium:     { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)" },
  low:        { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)" },
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  const s = BADGE_STYLES[variant] ?? BADGE_STYLES.allow;
  return (
    <span style={{
      display: "inline-block",
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", padding: "2px 7px", borderRadius: "4px",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {children}
    </span>
  );
}

// ── Grade badge ────────────────────────────────────────────────────────────

export function GradeBadge({ grade, score }: { grade?: string; score?: number }) {
  const color = grade === "A" || grade === "B" ? "#4ade80"
    : grade === "C" ? "#fbbf24"
    : grade === "D" ? "#fb923c"
    : "#f87171";

  const border = grade === "A" || grade === "B" ? "rgba(74,222,128,0.3)"
    : grade === "C" ? "rgba(251,191,36,0.3)"
    : grade === "D" ? "rgba(251,146,60,0.3)"
    : "rgba(248,113,113,0.3)";

  return (
    <div style={{
      width: "44px", height: "44px", borderRadius: "10px",
      background: `${color}10`, border: `1px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: "20px", fontWeight: 800, color, lineHeight: 1 }}>
        {grade ?? "?"}
      </span>
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: {
      background: "transparent",
      color: "#6ef2ff",
      border: "1px solid rgba(110,242,255,0.3)",
    },
    secondary: {
      background: "transparent",
      color: "#a1a1aa",
      border: "1px solid #1a1a1f",
    },
    danger: {
      background: "transparent",
      color: "#f87171",
      border: "1px solid rgba(248,113,113,0.3)",
    },
  };

  const padding = size === "sm" ? "5px 10px" : "8px 14px";
  const fontSize = size === "sm" ? "12px" : "13px";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding, fontSize, fontWeight: 500, borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${size > 20 ? 2 : 1.5}px solid #1a1a1f`,
      borderTopColor: "#6ef2ff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}/>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: "#111115", border: "1px solid #1a1a1f",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#3f3f46" strokeWidth="1.2"/>
          <path d="M8 5v3M8 10v.5" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 500, color: "#f0f0f2", marginBottom: "6px" }}>{title}</p>
      {description && <p style={{ fontSize: "13px", color: "#52525b", marginBottom: "16px" }}>{description}</p>}
      {action}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
      <h2 style={{ fontSize: "14px", fontWeight: 500, color: "#f0f0f2" }}>{title}</h2>
      {action}
    </div>
  );
}
