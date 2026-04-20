"use client";
// Ported from App.jsx's top banner + TattvaHeader.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site-config";

const NAV_ITEMS = [
  { key: "current", href: "/", label: "Current" },
  { key: "archive", href: "/archive", label: "Archive" },
  { key: "about", href: "/about", label: "About" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const accent = SITE.accent;

  const isActive = (href: string) => {
    if (href === "/") {
      // "Current" is active on home OR on any article page ([slug])
      return pathname === "/" || (!pathname.startsWith("/archive") && !pathname.startsWith("/about") && !pathname.startsWith("/notebook") && !pathname.startsWith("/admin"));
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top banner */}
      <div
        style={{
          background: "#2B2520",
          padding: "11px 0",
          textAlign: "center",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "#C4B9A8",
          fontWeight: 500,
        }}
      >
        Dharma <span style={{ color: accent, margin: "0 12px" }}>·</span> Text <span style={{ color: accent, margin: "0 12px" }}>·</span> Inheritance
      </div>

      {/* Masthead */}
      <header style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 40px 0" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div style={{ textAlign: "center", paddingBottom: "36px" }}>
            <div
              style={{
                fontFamily: "'Noto Serif Devanagari', 'Cormorant Garamond', serif",
                fontSize: "22px",
                color: accent,
                letterSpacing: "0.06em",
                fontWeight: 500,
                marginBottom: "10px",
              }}
            >
              तत्त्व
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "76px",
                fontWeight: 500,
                color: "#1a1714",
                margin: 0,
                letterSpacing: "-0.005em",
                lineHeight: 0.95,
              }}
            >
              Tattva
            </h1>
          </div>
        </Link>

        {/* Nav bar */}
        <nav
          style={{
            borderTop: "1px solid #1a1714",
            borderBottom: "1px solid #d8d2c8",
            display: "flex",
            justifyContent: "center",
            gap: "52px",
            padding: "16px 0",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? accent : "#6b6259",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 500,
                  transition: "color 0.2s ease",
                  paddingBottom: "2px",
                  borderBottom: active ? `1.5px solid ${accent}` : "1.5px solid transparent",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = accent;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#6b6259";
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
