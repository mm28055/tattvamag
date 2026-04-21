"use client";
// Archive: tabs (essays/notebook), search, tag + author filters. Ported from Archive.jsx.
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import type { FrontendArticle, FrontendNotebookEntry } from "@/lib/frontend-types";

type Item = {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  tags: string[];
  author: string;
  readTime?: string;
  kind: "essay" | "note";
};

export default function ArchiveView({
  articles,
  notebookEntries,
  accent,
  tagMuted,
  authorBios,
}: {
  articles: FrontendArticle[];
  notebookEntries: FrontendNotebookEntry[];
  accent: string;
  tagMuted: string;
  authorBios?: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") === "notebook" ? "notebook" : "essays") as "essays" | "notebook";
  const initialTag = searchParams.get("tag") || null;
  const initialAuthor = searchParams.get("author") || null;

  const [tab, setTab] = useState<"essays" | "notebook">(initialTab);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(initialAuthor);
  const [authorOpen, setAuthorOpen] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setActiveTag(initialTag);
    setActiveAuthor(initialAuthor);
  }, [initialTab, initialTag, initialAuthor]);

  const source: Item[] = useMemo(
    () =>
      tab === "essays"
        ? articles.map((a) => ({
            id: a.slug,
            title: a.title,
            subtitle: a.subtitle,
            body: a.body,
            tags: a.tags,
            author: a.author,
            readTime: a.readTime,
            kind: "essay" as const,
          }))
        : notebookEntries.map((n) => ({
            id: n.id,
            title: n.title,
            body: typeof n.body === "string" ? n.body.split(/\n\n+/)[0] : (n.body[0] && "text" in n.body[0] ? (n.body[0] as { text: string }).text : ""),
            tags: n.tags,
            author: n.author,
            kind: "note" as const,
          })),
    [tab, articles, notebookEntries],
  );

  const allTags = useMemo(() => [...new Set(source.flatMap((a) => a.tags))].sort(), [source]);
  const allAuthors = useMemo(() => [...new Set(source.map((a) => a.author).filter(Boolean))].sort(), [source]);

  const q = query.trim().toLowerCase();
  const filtered = source.filter((a) => {
    if (activeTag && !a.tags.includes(activeTag)) return false;
    if (activeAuthor && a.author !== activeAuthor) return false;
    if (!q) return true;
    const hay = [a.title, a.subtitle, a.body, a.author, ...a.tags].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  const hasActiveFilter = !!(activeTag || activeAuthor || q);

  const clearAll = () => {
    setActiveTag(null);
    setActiveAuthor(null);
    setQuery("");
    router.replace(`/archive?tab=${tab}`);
  };

  const changeTab = (next: "essays" | "notebook") => {
    setTab(next);
    setActiveTag(null);
    setActiveAuthor(null);
    setQuery("");
    router.replace(`/archive?tab=${next}`);
  };

  const tabStyle = (key: "essays" | "notebook"): React.CSSProperties => ({
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: tab === key ? accent : "#8b7f72",
    cursor: "pointer",
    padding: "14px 0",
    borderBottom: tab === key ? `2px solid ${accent}` : "2px solid transparent",
    transition: "color 0.2s ease",
  });

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 40px 100px" }}>
      {/* Page header */}
      <div style={{ textAlign: "center", marginBottom: "44px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: tagMuted, fontWeight: 600, marginBottom: "14px" }}>
          The Archive
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "40px", fontWeight: 500, color: "#1a1714", margin: 0, lineHeight: 1.15, fontStyle: "italic" }}>
          Essays, notes, and fragments
        </h2>
        <div style={{ width: "40px", height: "1.5px", background: accent, margin: "22px auto 0" }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "56px", borderBottom: "1px solid #d8d2c8", marginBottom: "28px" }}>
        <span onClick={() => changeTab("essays")} style={tabStyle("essays")}>Essays</span>
        <span onClick={() => changeTab("notebook")} style={tabStyle("notebook")}>Notebook</span>
      </div>

      {/* Search + author */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === "essays" ? "essays" : "notebook entries"}…`}
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              border: "1px solid #d8d2c8",
              background: "#faf5e8",
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "15px",
              color: "#1a1714",
              outline: "none",
              borderRadius: "2px",
            }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#b0a89e", fontSize: "14px" }}>⌕</span>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setAuthorOpen((v) => !v)}
            style={{
              padding: "12px 18px",
              border: `1px solid ${activeAuthor ? accent : "#d8d2c8"}`,
              background: activeAuthor ? "#faf0ea" : "#faf5e8",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: activeAuthor ? accent : "#5a5048",
              cursor: "pointer",
              borderRadius: "2px",
              whiteSpace: "nowrap",
            }}
          >
            {activeAuthor || "Author"} ▾
          </button>
          {authorOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 20,
                background: "#fff",
                border: "1px solid #d8d2c8",
                borderRadius: "2px",
                minWidth: "240px",
                boxShadow: "0 8px 24px rgba(26, 23, 20, 0.12)",
                padding: "6px 0",
              }}
            >
              <div
                onClick={() => { setActiveAuthor(null); setAuthorOpen(false); }}
                style={{ padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: activeAuthor ? "#5a5048" : accent, cursor: "pointer", fontStyle: "italic" }}
              >
                All authors
              </div>
              {allAuthors.map((a) => (
                <div
                  key={a}
                  onClick={() => { setActiveAuthor(a); setAuthorOpen(false); }}
                  style={{ padding: "10px 18px", fontFamily: "'Source Serif 4', serif", fontSize: "14px", color: activeAuthor === a ? accent : "#1a1714", cursor: "pointer", background: activeAuthor === a ? "#faf0ea" : "transparent" }}
                >
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {allTags.map((tg) => {
            const on = activeTag === tg;
            return (
              <span
                key={tg}
                onClick={() => setActiveTag(on ? null : tg)}
                style={{
                  padding: "5px 12px",
                  border: `1px solid ${on ? accent : "#d4cdc2"}`,
                  background: on ? accent : "transparent",
                  color: on ? "#fff" : tagMuted,
                  borderRadius: "16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "10.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tg}
              </span>
            );
          })}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilter && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#6a5e54" }}>
          <span style={{ fontStyle: "italic", color: "#8b7f72" }}>Filtering by</span>
          {activeAuthor && (
            <span onClick={() => setActiveAuthor(null)} style={{ padding: "4px 10px", background: "#faf0ea", border: `1px solid ${accent}`, borderRadius: "2px", color: accent, cursor: "pointer" }}>
              {activeAuthor} ×
            </span>
          )}
          {activeTag && (
            <span onClick={() => setActiveTag(null)} style={{ padding: "4px 10px", background: "#faf0ea", border: `1px solid ${accent}`, borderRadius: "2px", color: accent, cursor: "pointer" }}>
              {activeTag} ×
            </span>
          )}
          {q && (
            <span onClick={() => setQuery("")} style={{ padding: "4px 10px", background: "#faf0ea", border: `1px solid ${accent}`, borderRadius: "2px", color: accent, cursor: "pointer" }}>
              “{q}” ×
            </span>
          )}
          <span onClick={clearAll} style={{ color: "#8b7f72", textDecoration: "underline", cursor: "pointer", marginLeft: "8px" }}>clear all</span>
        </div>
      )}

      {/* Author bio */}
      {activeAuthor && authorBios?.[activeAuthor] && (
        <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14px", lineHeight: 1.7, color: "#5a5048", marginBottom: "28px", paddingBottom: "28px", borderBottom: "1px solid #d8d2c8" }}>
          {authorBios[activeAuthor]}
        </div>
      )}

      {/* Result count */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#b0a89e", fontWeight: 500, marginBottom: "12px" }}>
        {filtered.length} {tab === "essays" ? "essay" : "entry"}
        {filtered.length === 1 ? "" : tab === "essays" ? "s" : "ies"}
      </div>

      {/* Cards */}
      {filtered.length === 0 && (
        <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "20px", color: "#8b7f72" }}>
          Nothing matches.{" "}
          <span onClick={clearAll} style={{ color: accent, cursor: "pointer" }}>Clear filters →</span>
        </div>
      )}

      {filtered.map((a) => (
        <ArchiveCard
          key={a.id}
          item={a}
          accent={accent}
          tagMuted={tagMuted}
          onTagClick={(tg) => setActiveTag(tg)}
          onAuthorClick={(au) => setActiveAuthor(au)}
        />
      ))}
    </main>
  );
}

function ArchiveCard({
  item,
  accent,
  tagMuted,
  onTagClick,
  onAuthorClick,
}: {
  item: Item;
  accent: string;
  tagMuted: string;
  onTagClick: (tg: string) => void;
  onAuthorClick: (au: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const excerpt = (() => {
    const t = item.body || "";
    if (t.length <= 220) return t;
    const cut = t.slice(0, 220);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace) + "…";
  })();

  const href = (item.kind === "essay" ? `/${item.id}` : `/notebook#${item.id}`) as Route;

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ borderTop: "1px solid #e2ddd5", padding: "28px 0" }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "10px" }}>
        {item.tags.map((tg) => (
          <span
            key={tg}
            onClick={(e) => { e.stopPropagation(); onTagClick(tg); }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "10px",
              color: tagMuted,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tg}
          </span>
        ))}
      </div>

      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 500,
            color: hover ? accent : "#1a1714",
            margin: 0,
            lineHeight: 1.22,
            letterSpacing: "-0.005em",
            transition: "color 0.2s ease",
            cursor: "pointer",
          }}
        >
          {item.title}
        </h3>
      </Link>

      {item.subtitle && (
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "17px", color: "#554a40", marginTop: "6px", lineHeight: 1.45 }}>
          {item.subtitle}
        </div>
      )}

      <div style={{ width: "28px", height: "1.5px", background: accent, margin: "14px 0" }} />

      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14.5px", lineHeight: 1.7, color: "#3a3530", margin: 0, maxWidth: "720px" }}>
        {excerpt}
      </p>

      <div style={{ marginTop: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", color: "#8b7f72" }}>
        <span
          onClick={(e) => { e.stopPropagation(); onAuthorClick(item.author); }}
          style={{ color: "#5a5048", fontWeight: 500, cursor: "pointer", borderBottom: "1px dotted #b0a89e" }}
        >
          {item.author}
        </span>
        {item.readTime && (
          <>
            <span style={{ margin: "0 10px", color: "#d4cdc2" }}>·</span>
            <span>{item.readTime}</span>
          </>
        )}
      </div>
    </article>
  );
}
