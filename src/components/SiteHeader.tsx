"use client";
// Ported from App.jsx's top banner + TattvaHeader, plus a sticky compact
// header that fades in after the user scrolls past the masthead.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site-config";

const NAV_ITEMS = [
  { key: "current", href: "/", label: "Current" },
  { key: "archive", href: "/archive", label: "Archive" },
  { key: "about", href: "/about", label: "About" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const accent = SITE.accent;
  const mastheadRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      // "Current" is active on home OR on any article page ([slug])
      return (
        pathname === "/" ||
        (!pathname.startsWith("/archive") &&
          !pathname.startsWith("/about") &&
          !pathname.startsWith("/notebook") &&
          !pathname.startsWith("/admin"))
      );
    }
    return pathname.startsWith(href);
  };

  // Fade the sticky bar in once the full masthead has scrolled off-screen.
  useEffect(() => {
    const onScroll = () => {
      const el = mastheadRef.current;
      if (!el) return;
      const bottom = el.getBoundingClientRect().bottom;
      setShowSticky(bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        Dharma <span style={{ color: accent, margin: "0 12px" }}>·</span> Text{" "}
        <span style={{ color: accent, margin: "0 12px" }}>·</span> Inheritance
      </div>

      {/* ── Masthead + nav (normal, in-flow) ── */}
      <div ref={mastheadRef}>
        <header className="tm-masthead" style={{ maxWidth: "1200px", margin: "0 auto", padding: "36px 40px 0" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div style={{ textAlign: "center", paddingBottom: "22px" }}>
              <div
                style={{
                  fontFamily: "'Noto Serif Devanagari', 'Cormorant Garamond', serif",
                  fontSize: "22px",
                  color: accent,
                  letterSpacing: "0.06em",
                  fontWeight: 500,
                  marginBottom: "6px",
                }}
              >
                तत्त्व
              </div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "68px",
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
      </div>

      {/* ── Sticky compact header — fades in once masthead has scrolled away ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          background: "#2B2520",
          borderBottom: "1px solid #3d3530",
          boxShadow: showSticky ? "0 2px 16px rgba(0,0,0,0.15)" : "none",
          opacity: showSticky ? 1 : 0,
          transform: showSticky ? "translateY(0)" : "translateY(-100%)",
          pointerEvents: showSticky ? "auto" : "none",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div
          className="tm-sticky-bar"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "48px",
          }}
        >
          {/* Compact logo — तत्त्व · Tattva */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Serif Devanagari', 'Cormorant Garamond', serif",
                fontSize: "18px",
                color: accent,
                fontWeight: 500,
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              तत्त्व
            </span>
            <span style={{ color: accent, fontSize: "13px", lineHeight: 1 }}>·</span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "22px",
                color: "#E8E0D4",
                fontWeight: 500,
                letterSpacing: "-0.005em",
                lineHeight: 1,
              }}
            >
              Tattva
            </span>
          </Link>

          {/* Compact nav */}
          <nav style={{ display: "flex", gap: "32px" }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active ? accent : "#C4B9A8",
                    cursor: "pointer",
                    fontWeight: active ? 600 : 500,
                    transition: "color 0.2s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = accent;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "#C4B9A8";
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
