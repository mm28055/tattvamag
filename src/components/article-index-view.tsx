"use client";
// Shared section landing page (used by /essays and /reflections): a Notebook-
// style intro header + a single-column list of cards. Each card opens the full
// essay (/[slug]), whose reader then infinite-scrolls through the rest of the
// same kind.
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { FrontendArticle } from "@/lib/frontend-types";

export default function ArticleIndexView({
  items,
  accent,
  tagMuted,
  kicker,
  title,
  subtitle,
  italicTitles = false,
  emptyLabel = "Nothing here yet.",
}: {
  items: FrontendArticle[];
  accent: string;
  tagMuted: string;
  kicker: string;
  title: string;
  subtitle: string;
  italicTitles?: boolean;
  emptyLabel?: string;
}) {
  return (
    <main style={{ padding: "0 0 100px" }}>
      {/* Intro header — echoes the Notebook page. */}
      <header style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 40px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: accent, fontWeight: 600, marginBottom: "14px" }}>
          {kicker}
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "44px", fontStyle: "italic", fontWeight: 500, color: "#1a1714", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          {title}
        </h1>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "16px", lineHeight: 1.7, color: "#6b6259", marginTop: "20px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
          {subtitle}
        </p>
      </header>

      {/* Hairline */}
      <div style={{ maxWidth: "600px", margin: "0 auto 48px", padding: "0 32px" }}>
        <div style={{ height: "1px", background: accent, opacity: 0.3, width: "60px" }} />
      </div>

      {/* List */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 40px" }}>
        {items.map((a) => (
          <IndexCard key={a.id} article={a} accent={accent} tagMuted={tagMuted} italicTitle={italicTitles} />
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "18px", color: "#8b7f72" }}>
            {emptyLabel}
          </div>
        )}
      </div>
    </main>
  );
}

function IndexCard({ article, accent, tagMuted, italicTitle }: { article: FrontendArticle; accent: string; tagMuted: string; italicTitle: boolean }) {
  const [hover, setHover] = useState(false);
  const excerpt = (() => {
    const t = article.body || "";
    if (t.length <= 260) return t;
    const cut = t.slice(0, 260);
    const ls = cut.lastIndexOf(" ");
    return cut.slice(0, ls > 0 ? ls : 260) + "…";
  })();

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ borderTop: "1px solid #e2ddd5", padding: "32px 0" }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "10px" }}>
        {article.tags.map((tg) => (
          <span
            key={tg}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: tagMuted, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}
          >
            {tg}
          </span>
        ))}
      </div>

      <Link href={`/${article.slug}` as Route} style={{ textDecoration: "none", color: "inherit" }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "30px",
            fontStyle: italicTitle ? "italic" : "normal",
            fontWeight: 500,
            color: hover ? accent : "#1a1714",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            transition: "color 0.2s ease",
            cursor: "pointer",
          }}
        >
          {article.title}
        </h2>
      </Link>

      {article.subtitle && (
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "17px", color: "#554a40", marginTop: "8px", lineHeight: 1.45 }}>
          {article.subtitle}
        </div>
      )}

      <div style={{ width: "28px", height: "1.5px", background: accent, margin: "14px 0" }} />

      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.75, color: "#3a3530", margin: 0, maxWidth: "640px" }}>
        {excerpt}
      </p>

      <div style={{ marginTop: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", color: "#8b7f72" }}>
        <span style={{ color: "#5a5048", fontWeight: 500 }}>{article.author}</span>
        {article.readTime && (
          <>
            <span style={{ margin: "0 10px", color: "#d4cdc2" }}>·</span>
            <span>{article.readTime}</span>
          </>
        )}
      </div>
    </article>
  );
}
