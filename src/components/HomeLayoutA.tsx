// Layout A — Variant 1 "Text-Focused" from tattvamag-four-variants.jsx
// Centered featured essay, no image, 40px cinnabar rule separating subtitle from excerpt.
// Below: 3-column grid of secondary essays, text-only, divided by vertical rules.
// All text-first, quiet, editorial.

import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate } from "@/lib/content";

export default function HomeLayoutA({
  featured,
  secondary,
}: {
  featured: Article;
  secondary: Article[];
}) {
  return (
    <div className="max-w-[1100px] mx-auto px-10 pb-28">
      {/* ══ FEATURED — centered, symmetric ══ */}
      <section
        className="pt-16 pb-14"
        style={{ borderBottom: "1px solid var(--color-divider)" }}
      >
        <Link href={`/${featured.slug}`} className="block group">
          <div className="max-w-[680px] mx-auto text-center">
            {/* Category/tags line */}
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                fontWeight: 600,
                marginBottom: "22px",
              }}
            >
              {featured.tags.slice(0, 3).map((t) => t.name).join("  ·  ") || featured.category.name}
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "44px",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--color-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
              className="transition-colors duration-300 group-hover:text-[color:var(--color-accent)]"
            >
              {featured.title}
            </h2>

            {/* Italic subtitle */}
            {featured.subtitle && (
              <p
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "19px",
                  fontStyle: "italic",
                  color: "var(--color-meta)",
                  marginTop: "18px",
                  lineHeight: 1.55,
                  fontWeight: 400,
                }}
              >
                {featured.subtitle}
              </p>
            )}

            {/* Short cinnabar rule */}
            <div
              style={{
                width: "40px",
                height: "2px",
                background: "var(--color-accent)",
                margin: "28px auto 24px",
              }}
            />

            {/* Excerpt — left-aligned */}
            <p
              style={{
                fontFamily: "var(--font-reading), serif",
                fontSize: "17px",
                lineHeight: 1.85,
                color: "var(--color-body-muted)",
                margin: 0,
                textAlign: "left",
              }}
            >
              {trim(featured.metaDescription, 420)}
            </p>

            {/* Author · read time · date */}
            <div
              className="flex gap-2 justify-center"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "12px",
                color: "var(--color-meta-faded)",
                marginTop: "28px",
              }}
            >
              <span style={{ fontWeight: 500, color: "var(--color-body-faded)" }}>
                {featured.author}
              </span>
              <span style={{ color: "var(--color-tag-border)" }}>·</span>
              <span>{featured.readTime}</span>
              <span style={{ color: "var(--color-tag-border)" }}>·</span>
              <span>{formatDate(featured.date)}</span>
            </div>
          </div>
        </Link>
      </section>

      {/* ══ SECONDARY — 3-col text-only grid ══ */}
      {secondary.length > 0 && (
        <section
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ borderBottom: "1px solid var(--color-divider)" }}
        >
          {secondary.slice(0, 3).map((a, i) => (
            <Link
              key={a.slug}
              href={`/${a.slug}`}
              className="group"
              style={{
                padding: "40px 28px",
                paddingLeft: i === 0 ? 0 : "28px",
                paddingRight: i === 2 ? 0 : "28px",
                borderRight: i < 2 ? "1px solid var(--color-divider-soft)" : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  fontWeight: 500,
                }}
              >
                {a.tags.slice(0, 2).map((t) => t.name).join(" · ") || a.category.name}
              </span>

              <h3
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "21px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: "var(--color-ink)",
                  margin: "12px 0 0",
                  letterSpacing: "-0.005em",
                }}
                className="transition-colors duration-300 group-hover:text-[color:var(--color-accent)]"
              >
                {a.title}
              </h3>

              {a.subtitle && (
                <p
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontSize: "14px",
                    color: "var(--color-meta)",
                    marginTop: "8px",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  {a.subtitle}
                </p>
              )}

              <p
                style={{
                  fontFamily: "var(--font-reading), serif",
                  fontSize: "14.5px",
                  lineHeight: 1.7,
                  color: "var(--color-body-faded)",
                  marginTop: "14px",
                }}
              >
                {trim(a.metaDescription, 190)}
              </p>

              <div
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: "var(--color-meta-faded)",
                  marginTop: "18px",
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--color-meta)" }}>{a.author}</span>
                <span style={{ margin: "0 6px", color: "var(--color-tag-border)" }}>·</span>
                <span>{a.readTime}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* ══ MORE ESSAYS — compact list ══ */}
      {secondary.length > 3 && (
        <section className="mt-16 max-w-[780px] mx-auto">
          <div className="flex items-baseline gap-5 mb-5">
            <h4
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-meta)",
                fontWeight: 500,
                margin: 0,
              }}
            >
              More essays
            </h4>
            <div className="flex-1" style={{ height: "1px", background: "var(--color-divider-soft)" }} />
          </div>
          {secondary.slice(3).map((a) => (
            <Link
              key={a.slug}
              href={`/${a.slug}`}
              className="flex items-baseline gap-6 py-5 group"
              style={{ borderTop: "1px solid var(--color-divider-soft)" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  fontWeight: 500,
                  minWidth: "150px",
                }}
              >
                {a.category.name}
              </span>
              <h5
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "19px",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "var(--color-ink)",
                  flex: 1,
                  letterSpacing: "-0.005em",
                }}
                className="transition-colors duration-300 group-hover:text-[color:var(--color-accent)]"
              >
                {a.title}
              </h5>
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: "var(--color-meta-faded)",
                  minWidth: "80px",
                  textAlign: "right",
                }}
              >
                {a.readTime}
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function trim(s: string, n: number) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
}
