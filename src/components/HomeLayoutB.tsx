// Layout B — tattvamag-v2 mockup. Text-only, editorial.
// Featured: "Latest" micro-label, 2-column text split (title/meta on left, excerpt with left rule on right).
// Middle belt: 3-column secondary essays grid with vertical dividers and uppercase muted tags.
// Bottom: "From the Notebook" — italic heading with horizontal rule extending right, 2-col notebook grid.

import Link from "next/link";
import type { Article } from "@/lib/content";

export default function HomeLayoutB({
  featured,
  secondary,
  notebook,
}: {
  featured: Article;
  secondary: Article[];
  notebook: Article[];
}) {
  return (
    <div className="max-w-[1140px] mx-auto px-10 pb-28">
      {/* ══ FEATURED ESSAY — 2-col text split ══ */}
      <section
        className="pt-14 pb-12"
        style={{ borderBottom: "1px solid var(--color-divider)" }}
      >
        <Link href={`/${featured.slug}`} className="block group">
          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-meta-softest)",
              marginBottom: "22px",
              fontWeight: 500,
            }}
          >
            Latest
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
            {/* LEFT: title + subtitle + meta */}
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display-alt), serif",
                  fontSize: "38px",
                  fontWeight: 700,
                  lineHeight: 1.18,
                  color: "var(--color-ink)",
                  margin: 0,
                  letterSpacing: "-0.005em",
                }}
                className="transition-colors duration-300 group-hover:text-[color:var(--color-hover-warm)]"
              >
                {featured.title}
              </h2>
              {featured.subtitle && (
                <p
                  style={{
                    fontFamily: "var(--font-reading), serif",
                    fontSize: "17px",
                    fontStyle: "italic",
                    color: "var(--color-meta)",
                    marginTop: "16px",
                    lineHeight: 1.55,
                  }}
                >
                  {featured.subtitle}
                </p>
              )}
              <div
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "12px",
                  color: "var(--color-meta-faded)",
                  marginTop: "22px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--color-body-faded)" }}>
                  {featured.author}
                </span>
                <span style={{ color: "var(--color-tag-border)" }}>·</span>
                <span>{featured.readTime}</span>
              </div>
            </div>

            {/* RIGHT: excerpt with left vertical rule */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-reading), serif",
                  fontSize: "17px",
                  lineHeight: 1.8,
                  color: "var(--color-body-muted)",
                  margin: 0,
                  borderLeft: "3px solid var(--color-divider)",
                  paddingLeft: "28px",
                }}
              >
                {trim(featured.metaDescription, 460)}
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* ══ MIDDLE BELT — 3-col secondary essays ══ */}
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
                padding: "40px 32px 40px 0",
                paddingLeft: i > 0 ? "32px" : "0",
                borderRight: i < 2 ? "1px solid var(--color-divider-soft)" : "none",
              }}
            >
              {/* Tags: uppercase muted */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {a.tags.slice(0, 2).length > 0
                  ? a.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.slug}
                        style={{
                          fontFamily: "var(--font-sans), sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--color-meta-softest)",
                        }}
                      >
                        {t.name}
                      </span>
                    ))
                  : (
                      <span
                        style={{
                          fontFamily: "var(--font-sans), sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--color-meta-softest)",
                        }}
                      >
                        {a.category.name}
                      </span>
                    )}
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-display-alt), serif",
                  fontSize: "23px",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: "var(--color-ink)",
                  margin: 0,
                  letterSpacing: "-0.005em",
                }}
                className="transition-colors duration-300 group-hover:text-[color:var(--color-hover-warm)]"
              >
                {a.title}
              </h3>

              {a.subtitle && (
                <p
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "13px",
                    color: "var(--color-meta)",
                    marginTop: "8px",
                    lineHeight: 1.5,
                    fontStyle: "italic",
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
                {trim(a.metaDescription, 200)}
              </p>

              <div
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: "var(--color-meta-faded)",
                  marginTop: "16px",
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

      {/* ══ FURTHER READING (compact list of essays 4+) ══ */}
      {secondary.length > 3 && (
        <section className="pt-10 mt-2">
          <div className="flex items-center gap-6 mb-4">
            <div
              style={{
                fontFamily: "var(--font-display-alt), serif",
                fontSize: "22px",
                fontWeight: 600,
                fontStyle: "italic",
                color: "var(--color-ink)",
              }}
            >
              Further reading
            </div>
            <div className="flex-1" style={{ height: "1px", background: "var(--color-divider-softer)" }} />
          </div>
          <div>
            {secondary.slice(3).map((a) => (
              <Link
                key={a.slug}
                href={`/${a.slug}`}
                className="flex items-baseline gap-6 py-5 group"
                style={{ borderTop: "1px solid var(--color-divider-softer)" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-meta-softest)",
                    minWidth: "160px",
                  }}
                >
                  {a.category.name}
                </span>
                <h5
                  style={{
                    fontFamily: "var(--font-display-alt), serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: "var(--color-ink)",
                    flex: 1,
                  }}
                  className="transition-colors duration-300 group-hover:text-[color:var(--color-hover-warm)]"
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
          </div>
        </section>
      )}

      {/* ══ FROM THE NOTEBOOK — italic heading + horizontal rule ══ */}
      {notebook.length > 0 && (
        <section className="pt-16">
          <div className="flex items-center gap-6 mb-6">
            <div
              style={{
                fontFamily: "var(--font-display-alt), serif",
                fontSize: "22px",
                fontWeight: 600,
                fontStyle: "italic",
                color: "var(--color-ink)",
              }}
            >
              From the Notebook
            </div>
            <div className="flex-1" style={{ height: "1px", background: "var(--color-divider-softer)" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {notebook.map((n, i) => (
              <Link
                key={n.slug}
                href={`/${n.slug}`}
                className="group"
                style={{
                  padding: "24px 0",
                  paddingRight: i % 2 === 0 ? "36px" : "0",
                  paddingLeft: i % 2 === 1 ? "36px" : "0",
                  borderRight: i % 2 === 0 ? "1px solid var(--color-divider-softer)" : "none",
                  borderTop: i >= 2 ? "1px solid var(--color-divider-softer)" : "none",
                }}
              >
                <h4
                  style={{
                    fontFamily: "var(--font-display-alt), serif",
                    fontSize: "19px",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: "var(--color-ink)",
                    margin: 0,
                    letterSpacing: "-0.005em",
                  }}
                  className="transition-colors duration-300 group-hover:text-[color:var(--color-hover-warm)]"
                >
                  {n.title}
                </h4>
                <div
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "11px",
                    color: "var(--color-meta-softest)",
                    marginTop: "6px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span>{n.author}</span>
                  {n.tags.slice(0, 1).map((t) => (
                    <span key={t.slug} style={{ color: "var(--color-divider)" }}>·</span>
                  ))}
                  {n.tags.slice(0, 1).map((t) => (
                    <span
                      key={t.slug}
                      style={{
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontSize: "10px",
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-reading), serif",
                    fontSize: "14.5px",
                    lineHeight: 1.7,
                    color: "var(--color-body-faded)",
                    marginTop: "12px",
                    marginBottom: 0,
                  }}
                >
                  {trim(n.metaDescription, 220)}
                </p>
              </Link>
            ))}
          </div>
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
