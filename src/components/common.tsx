"use client";
// Shared tiny components: Ornament, Tags, ByLine, truncate helper.
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import React from "react";

export function truncate(text: string | undefined, n: number): string {
  if (!text) return "";
  if (text.length <= n) return text;
  const cut = text.slice(0, n);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : n).trimEnd() + "…";
}

export function Ornament({ accent, width = 22, margin = "20px 0" }: { accent: string; width?: number; margin?: string }) {
  return <div aria-hidden style={{ width: `${width}px`, height: "2px", background: accent, margin }} />;
}

// Cards show at most 3 tags — more than that unbalances the grid layout
// (see the editorial design — each card has 2–3 tags).
const MAX_CARD_TAGS = 3;

export function Tags({
  tags,
  muted,
  onTagClick,
  max = MAX_CARD_TAGS,
}: {
  tags: string[];
  muted: string;
  onTagClick?: (tag: string) => void;
  max?: number;
}) {
  const base: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "10px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: muted,
    fontWeight: 600,
  };
  const shown = tags.slice(0, max);
  return (
    <span style={base}>
      {shown.map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && <span style={{ color: "#d4cdc2", margin: "0 8px" }}>·</span>}
          {onTagClick ? (
            <span
              onClick={(e) => { e.stopPropagation(); onTagClick(t); }}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {t}
            </span>
          ) : (
            <span>{t}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

/** Tag used as an anchor link — navigates to archive with the tag pre-selected.
 * Rendered as <span role="link"> (not <a>) because this component is typically
 * placed inside an outer <Link>-wrapped card, and nested <a> is invalid HTML.
 * Navigation happens via router.push so SPA transitions still work. */
export function TagAsLink({
  tags,
  muted,
  tab = "essays",
  max = MAX_CARD_TAGS,
}: {
  tags: string[];
  muted: string;
  tab?: "essays" | "notebook";
  max?: number;
}) {
  const router = useRouter();
  const base: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "10px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: muted,
    fontWeight: 600,
  };
  const shown = tags.slice(0, max);
  return (
    <span style={base}>
      {shown.map((t, i) => {
        const href = `/archive?tab=${tab}&tag=${encodeURIComponent(t)}`;
        return (
          <React.Fragment key={t}>
            {i > 0 && <span style={{ color: "#d4cdc2", margin: "0 8px" }}>·</span>}
            <span
              role="link"
              tabIndex={0}
              data-href={href}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); router.push(href as Route); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(href as Route); } }}
              style={{ cursor: "pointer", color: muted, textDecoration: "none", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {t}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

export function ByLine({ author, readTime }: { author: string; readTime: string }) {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "11.5px",
        color: "#9e958a",
        marginTop: "16px",
      }}
    >
      <span style={{ fontWeight: 500, color: "#554a40" }}>{author}</span>
      {readTime && (
        <>
          <span style={{ margin: "0 8px", color: "#d4cdc2" }}>·</span>
          <span>{readTime}</span>
        </>
      )}
    </div>
  );
}

export function ShowMoreLink({ label, accent, href }: { label: string; accent: string; href: Route }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0 40px", borderBottom: "1px solid #ddd8cf" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "11.5px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: accent,
          cursor: "pointer",
          paddingBottom: "3px",
          borderBottom: `1px solid ${accent}`,
          textDecoration: "none",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {label} →
      </Link>
    </div>
  );
}
