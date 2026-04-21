"use client";
// Ported from App.jsx footer.
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export default function SiteFooter() {
  const accent = SITE.accent;
  return (
    <footer style={{ background: "#2B2520", padding: "56px 40px 40px", marginTop: "40px" }}>
      <div
        className="tm-footer-grid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: "56px",
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 500, color: "#E8E0D4", lineHeight: 1 }}>
            Tattva
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", color: "#A69788", fontStyle: "italic", marginTop: "4px", letterSpacing: "0.02em" }}>
            On dharma, text, and inheritance
          </div>
          <p
            style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "13px",
              lineHeight: 1.65,
              color: "#8B8079",
              marginTop: "22px",
              maxWidth: "320px",
            }}
          >
            An intellectual notebook on Indian textual traditions, philosophy, and the survival of inherited meaning under modernity.
          </p>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "10.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Sections
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#C4B9A8" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Current</Link>
            <Link href="/archive" style={{ color: "inherit", textDecoration: "none" }}>Archive</Link>
            <Link href="/notebook" style={{ color: "inherit", textDecoration: "none" }}>Notebook</Link>
            <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
            <a
              href="/rss.xml"
              style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
              title="Subscribe via RSS"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill={accent} aria-hidden="true">
                <path d="M2 4.5a1.5 1.5 0 0 1 1.5-1.5A12.5 12.5 0 0 1 17 15.5a1.5 1.5 0 0 1-3 0A9.5 9.5 0 0 0 3.5 6 1.5 1.5 0 0 1 2 4.5ZM2 11a1.5 1.5 0 0 1 1.5-1.5A6 6 0 0 1 10.5 16.5a1.5 1.5 0 0 1-3 0A3 3 0 0 0 3.5 12.5 1.5 1.5 0 0 1 2 11Zm2.75 3.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z"/>
              </svg>
              RSS
            </a>
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "10.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Correspondence
          </div>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "13px", lineHeight: 1.65, color: "#C4B9A8", margin: 0 }}>
            Letters and responses: <span style={{ color: "#E8E0D4" }}>correspondence@tattvamag.in</span>
          </p>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "13px", lineHeight: 1.65, color: "#8B8079", marginTop: "14px" }}>
            <em>Tattva Heritage Foundation</em>, Kolkata
            <br />
            <em>Centre for Shaiva Studies</em>, Pondicherry
            <br />
            <em>Karṇāṭa: Centre for Classical Kannada</em>, Mysore
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "28px auto 0",
          paddingTop: "18px",
          borderTop: "1px solid #3d3530",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "11px",
          color: "#8B8079",
          letterSpacing: "0.04em",
        }}
      >
        <span>© Manish Maheshwari</span>
        <span>Kolkata · Mysore · Pondicherry</span>
      </div>
    </footer>
  );
}
