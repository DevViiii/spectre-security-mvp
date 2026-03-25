"use client";

import { usePathname, useRouter } from "next/navigation";

const TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/scanner": "Scanner",
  "/shield": "Shield",
  "/shield/violations": "Violations",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const title = Object.entries(TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + "/")
  )?.[1] ?? "Spectre Security";

  function signOut() {
    document.cookie = "spectre_api_key=; path=/; max-age=0";
    router.push("/");
  }

  return (
    <header style={{
      height: "52px",
      background: "#070709",
      borderBottom: "1px solid #111115",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: "14px", fontWeight: 500, color: "#f0f0f2" }}>{title}</span>
      <button
        onClick={signOut}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "transparent", border: "none",
          fontSize: "12px", color: "#3f3f46", cursor: "pointer",
          padding: "5px 8px", borderRadius: "5px",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={e => (e.currentTarget.style.color = "#3f3f46")}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5M9 9.5l2.5-3L9 3.5M11.5 6.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sign out
      </button>
    </header>
  );
}
