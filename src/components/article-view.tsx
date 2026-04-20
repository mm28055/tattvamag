"use client";
// Ported from Article.jsx. Single article page with classical header, drop cap,
// inline <fn id="N" note="..." /> tokens with hover margin notes, endnotes, infinite scroll.
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Tags, TagAsLink } from "./common";
import type { FrontendArticle, Block } from "@/lib/frontend-types";
import CommentsClient from "./CommentsClient";

// ══════ Footnote parser: splits text on <fn id="N" note="..." /> tokens ══════
type FnToken = { id: string; note: string };

function parseFootnotes(text: string): Array<string | { footnote: FnToken }> {
  const re = /<fn\s+id="([^"]+)"\s+note="((?:[^"\\]|\\.)*)"\s*\/>/g;
  const nodes: Array<string | { footnote: FnToken }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push({ footnote: { id: m[1], note: m[2].replace(/\\"/g, '"') } });
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function collectFootnotes(fullBody: Block[]): FnToken[] {
  const out: FnToken[] = [];
  const seen = new Set<string>();
  fullBody.forEach((block) => {
    if (!("text" in block) || !block.text) return;
    const re = /<fn\s+id="([^"]+)"\s+note="((?:[^"\\]|\\.)*)"\s*\/>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block.text)) !== null) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, note: m[2].replace(/\\"/g, '"') });
    }
  });
  return out;
}

/** Render *italic* as <em> and preserved <sup>...</sup> tags inline. */
function renderInline(str: string): React.ReactNode[] {
  const pattern = /(\*[^*]+\*|<sup\b[^>]*>[\s\S]*?<\/sup>)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(str)) !== null) {
    if (m.index > last) {
      out.push(<React.Fragment key={`t${i++}`}>{str.slice(last, m.index)}</React.Fragment>);
    }
    const tok = m[0];
    if (tok.startsWith("*")) {
      out.push(<em key={`i${i++}`}>{tok.slice(1, -1)}</em>);
    } else {
      const inner = tok.replace(/<\/?sup[^>]*>/gi, "");
      out.push(
        <sup key={`s${i++}`} style={{ fontSize: "0.72em", lineHeight: 0, verticalAlign: "super" }}>
          {inner}
        </sup>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < str.length) {
    out.push(<React.Fragment key={`t${i++}`}>{str.slice(last)}</React.Fragment>);
  }
  return out;
}

// ══════ Footnote superscript ══════
function FootnoteSup({
  fn,
  accent,
  onOpen,
  isActive,
}: {
  fn: FnToken;
  accent: string;
  onOpen: (fn: FnToken | null, isOn: boolean) => void;
  isActive: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <sup
      onMouseEnter={() => { setHover(true); onOpen(fn, true); }}
      onMouseLeave={() => { setHover(false); onOpen(null, false); }}
      onClick={(e) => { e.stopPropagation(); onOpen(fn, true); }}
      data-fn-id={fn.id}
      style={{
        color: accent,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "11px",
        fontWeight: 600,
        padding: "0 2px",
        cursor: "pointer",
        verticalAlign: "super",
        lineHeight: 0,
        borderBottom: hover || isActive ? `1px solid ${accent}` : "1px solid transparent",
      }}
    >
      [{fn.id}]
    </sup>
  );
}

function renderParagraphNodes(
  text: string,
  accent: string,
  onOpenFn: (fn: FnToken | null, isOn: boolean) => void,
  activeFnId: string | null,
): React.ReactNode[] {
  const nodes = parseFootnotes(text);
  return nodes.map((n, i) => {
    if (typeof n === "string") {
      return <React.Fragment key={i}>{renderInline(n)}</React.Fragment>;
    }
    return <FootnoteSup key={i} fn={n.footnote} accent={accent} onOpen={onOpenFn} isActive={activeFnId === n.footnote.id} />;
  });
}

// ══════ Reading progress bar ══════
function ProgressBar({ accent }: { accent: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const articles = Array.from(document.querySelectorAll("[data-article-body]"));
      if (!articles.length) return;
      const mid = vh / 2;
      let active: Element | null = null;
      for (const a of articles) {
        const r = a.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { active = a; break; }
      }
      if (!active) {
        let best = articles[0];
        let bestDist = Infinity;
        for (const a of articles) {
          const r = a.getBoundingClientRect();
          const d = Math.abs((r.top + r.bottom) / 2 - mid);
          if (d < bestDist) { bestDist = d; best = a; }
        }
        active = best;
      }
      const r = active.getBoundingClientRect();
      const h = (active as HTMLElement).offsetHeight;
      const total = h;
      const scrolled = Math.max(0, Math.min(total, -r.top));
      setPct(total > 0 ? Math.min(1, scrolled / total) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "transparent", zIndex: 100 }}>
      <div style={{ height: "100%", width: `${pct * 100}%`, background: accent, transition: "width 0.1s ease-out" }} />
    </div>
  );
}

// ══════ Classical header ══════
function ClassicalHeader({ article, accent, tagMuted }: { article: FrontendArticle; accent: string; tagMuted: string }) {
  return (
    <header style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 40px 40px", textAlign: "center" }}>
      <div style={{ marginBottom: "24px" }}>
        <TagAsLink tags={article.tags} muted={tagMuted} />
      </div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "52px", fontWeight: 500, lineHeight: 1.12, color: "#1a1714", margin: 0, letterSpacing: "-0.01em" }}>
        {article.title}
      </h1>
      {article.subtitle && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontStyle: "italic", color: "#554a40", marginTop: "20px", lineHeight: 1.45, fontWeight: 400 }}>
          {article.subtitle}
        </p>
      )}
      <div style={{ width: "44px", height: "1.5px", background: accent, margin: "36px auto" }} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", letterSpacing: "0.1em", color: "#6b6259" }}>
        <span style={{ fontWeight: 600, color: "#3a3530" }}>{article.author}</span>
        <span style={{ margin: "0 10px", color: "#b0a89e" }}>·</span>
        <span>{article.readTime}</span>
      </div>
    </header>
  );
}

// ══════ Frontispiece image (real src, else placeholder) ══════
function FrontispieceImage({ src, label, caption, accent }: { src?: string; label?: string; caption?: string; accent: string }) {
  return (
    <figure style={{ margin: "0 auto", padding: "8px 40px 0", maxWidth: "1020px", textAlign: "center" }}>
      <div style={{ width: "60%", margin: "0 auto", maxWidth: "100%" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label || caption || ""} style={{ width: "100%", height: "auto", display: "block" }} />
        ) : (
          <PlaceholderBox label={label || "Frontispiece"} aspectRatio="4 / 5" />
        )}
      </div>
      {caption && (
        <figcaption
          style={{
            marginTop: "14px",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "15px",
            color: "#6b6259",
            lineHeight: 1.55,
            maxWidth: "440px",
            margin: "14px auto 0",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function PlaceholderBox({ label, aspectRatio = "16 / 10" }: { label: string; aspectRatio?: string }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio,
        background: "linear-gradient(155deg, #E8DCC4 0%, #DACCAE 50%, #C8B996 100%)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6b5b4a", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

// ══════ Body image (real or placeholder) ══════
function BodyImage({ src, label, caption }: { src?: string; label?: string; caption?: string }) {
  return (
    <figure style={{ margin: "44px 0", padding: 0 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label || caption || ""} style={{ width: "100%", height: "auto", display: "block" }} />
      ) : (
        <PlaceholderBox label={label || "Image"} />
      )}
      {caption && (
        <figcaption style={{ marginTop: "14px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: "#6b6259", lineHeight: 1.5, textAlign: "center" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ══════ Pullquote ══════
function Pullquote({ text, accent }: { text: string; accent: string }) {
  return (
    <blockquote style={{ margin: "52px 0", padding: "40px 0", borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, textAlign: "center" }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "28px", lineHeight: 1.4, color: "#2a2520", margin: 0, fontWeight: 400 }}>
        “{text}”
      </p>
    </blockquote>
  );
}

// ══════ Body paragraph with optional drop cap + margin footnote ══════
function BodyParagraph({
  text,
  dropCap,
  accent,
  onOpenFn,
  hoverFnId,
  activeFnId,
  fontSize,
}: {
  text: string;
  dropCap: boolean;
  accent: string;
  onOpenFn: (fn: FnToken | null, isOn: boolean) => void;
  hoverFnId: string | null;
  activeFnId: string | null;
  fontSize: number;
}) {
  const cited: FnToken[] = [];
  const re = /<fn\s+id="([^"]+)"\s+note="((?:[^"\\]|\\.)*)"\s*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    cited.push({ id: m[1], note: m[2].replace(/\\"/g, '"') });
  }

  let firstChar: string | null = null;
  let body = text;
  if (dropCap) {
    const match = body.match(/^(\s*)(\S)/);
    if (match) {
      firstChar = match[2];
      body = body.slice(match[1].length + 1);
    }
  }

  const nodes = renderParagraphNodes(body, accent, onOpenFn, hoverFnId || activeFnId);

  return (
    <div style={{ position: "relative", margin: "0 0 26px" }}>
      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: `${fontSize}px`, lineHeight: 1.75, color: "#2a2520", margin: 0, textAlign: "left" }}>
        {firstChar && (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "84px",
              lineHeight: 0.82,
              fontWeight: 500,
              color: accent,
              float: "left",
              marginRight: "14px",
              marginTop: "8px",
              marginBottom: "-6px",
            }}
          >
            {firstChar}
          </span>
        )}
        {nodes}
      </p>
      {cited.length > 0 && (
        <div
          className="tm-margin-note-col"
          style={{
            position: "absolute",
            left: "calc(100% + 48px)",
            top: 0,
            width: "240px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* dedupe — if the same footnote is cited twice in one paragraph, show it once */}
          {cited
            .filter((fn, i, arr) => arr.findIndex((x) => x.id === fn.id) === i)
            .map((fn) => {
              const isFocus = (hoverFnId || activeFnId) === fn.id;
              return (
                <aside
                  key={fn.id}
                  className="tm-margin-note"
                  data-active={isFocus ? "1" : "0"}
                  style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: "13.5px",
                    lineHeight: 1.55,
                    color: isFocus ? "#1a1714" : "#8b7f72",
                    paddingLeft: "16px",
                    borderLeft: `2px solid ${isFocus ? accent : "#d4cdc2"}`,
                    transition: "color 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    [{fn.id}]
                  </span>
                  {renderInline(fn.note)}
                </aside>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ══════ Endnotes ══════
function Endnotes({ notes, accent }: { notes: FnToken[]; accent: string }) {
  if (!notes.length) return null;
  return (
    <section style={{ maxWidth: "680px", margin: "72px auto 0", padding: "40px 40px 40px", borderTop: "1px solid #d8d2c8" }}>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: accent,
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        Notes
      </div>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {notes.map((fn, i) => (
          <li
            key={fn.id}
            id={`endnote-${fn.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr",
              gap: "8px",
              padding: "14px 0",
              borderBottom: i < notes.length - 1 ? "1px solid #e8e4dc" : "none",
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "14px",
              lineHeight: 1.65,
              color: "#3a3530",
            }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 700, color: accent, letterSpacing: "0.06em" }}>
              [{fn.id}]
            </span>
            <span>{renderInline(fn.note)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ══════ Mobile footnote sheet ══════
function MobileFnSheet({ fn, onClose, accent }: { fn: FnToken | null; onClose: () => void; accent: string }) {
  if (!fn) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "rgba(26, 23, 20, 0.25)",
        display: "flex",
        alignItems: "flex-end",
        animation: "tmFadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF5E8",
          width: "100%",
          padding: "28px 28px 36px",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          boxShadow: "0 -12px 40px rgba(26, 23, 20, 0.2)",
          maxHeight: "60vh",
          overflowY: "auto",
          animation: "tmSlideUp 0.26s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: accent }}>
            Note [{fn.id}]
          </span>
          <span onClick={onClose} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#6b6259", cursor: "pointer" }}>✕</span>
        </div>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.65, color: "#2a2520", margin: 0 }}>
          {renderInline(fn.note)}
        </p>
      </div>
    </div>
  );
}

// ══════ Article body renderer ══════
function ArticleBody({ article, accent, tagMuted, measure, bodyFontSize }: { article: FrontendArticle; accent: string; tagMuted: string; measure: number; bodyFontSize: number }) {
  const [hoverFn, setHoverFn] = useState<FnToken | null>(null);
  const [activeFn, setActiveFn] = useState<FnToken | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onOpenFn = (fn: FnToken | null, isOn: boolean) => {
    if (isMobile) {
      if (fn && isOn) setActiveFn(fn);
      return;
    }
    setHoverFn(isOn ? fn : null);
  };

  const blocks: Block[] = article.fullBody || [{ type: "p", text: article.body }];
  const endnotes = collectFootnotes(blocks);
  const firstParagraphIdx = blocks.findIndex((b) => b.type === "p");

  return (
    <article data-article-body data-article-id={article.id}>
      <ClassicalHeader article={article} accent={accent} tagMuted={tagMuted} />

      {article.heroStyle === "image" && article.frontispiece && (
        <FrontispieceImage
          src={article.frontispiece.src}
          label={article.frontispiece.label}
          caption={article.frontispiece.caption}
          accent={accent}
        />
      )}

      <div style={{ maxWidth: `${measure}px`, margin: "0 auto", padding: "56px 40px 40px", position: "relative" }}>
        {blocks.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2
                key={i}
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "32px",
                  fontWeight: 500,
                  color: "#1a1714",
                  marginTop: "48px",
                  marginBottom: "20px",
                  letterSpacing: "-0.004em",
                  fontStyle: "italic",
                }}
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === "pullquote") {
            return <Pullquote key={i} text={block.text} accent={accent} />;
          }
          if (block.type === "image") {
            return <BodyImage key={i} src={block.src} label={block.label} caption={block.caption} />;
          }
          if (block.type === "quote") {
            return <Pullquote key={i} text={block.text} accent={accent} />;
          }
          return (
            <BodyParagraph
              key={i}
              text={block.text}
              dropCap={i === firstParagraphIdx}
              accent={accent}
              onOpenFn={onOpenFn}
              hoverFnId={hoverFn?.id || null}
              activeFnId={activeFn?.id || null}
              fontSize={bodyFontSize}
            />
          );
        })}
      </div>

      <Endnotes notes={endnotes} accent={accent} />
      <MobileFnSheet fn={activeFn} onClose={() => setActiveFn(null)} accent={accent} />
    </article>
  );
}

// ══════ Next article preview ══════
function NextArticlePreview({ article, tagMuted }: { article: FrontendArticle; tagMuted: string }) {
  return (
    <div style={{ maxWidth: "760px", margin: "80px auto 0", padding: "40px 40px 0", textAlign: "center", borderTop: "1px solid #d8d2c8" }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#b0a89e", fontWeight: 600 }}>
        Continue reading
      </div>
      <div style={{ marginTop: "14px", marginBottom: "10px" }}>
        <Tags tags={article.tags} muted={tagMuted} />
      </div>
      <Link href={`/${article.slug}` as Route} style={{ textDecoration: "none", color: "inherit" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "38px", fontWeight: 500, color: "#1a1714", margin: "0 0 8px", lineHeight: 1.18, cursor: "pointer" }}>
          {article.title}
        </h2>
      </Link>
      {article.subtitle && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "18px", color: "#6b6259", margin: 0 }}>
          {article.subtitle}
        </p>
      )}
      <div style={{ marginTop: "18px", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#9e958a" }}>
        <span>{article.author}</span>
        <span style={{ margin: "0 8px", color: "#d4cdc2" }}>·</span>
        <span>{article.readTime}</span>
      </div>
    </div>
  );
}

// ══════ ArticleView (main export, with infinite scroll) ══════
export default function ArticleView({
  startArticle,
  allArticles,
  accent,
  tagMuted,
  measure,
  bodyFontSize,
}: {
  startArticle: FrontendArticle;
  allArticles: FrontendArticle[];
  accent: string;
  tagMuted: string;
  measure: number;
  bodyFontSize: number;
}) {
  const [chain, setChain] = useState<string[]>([startArticle.id]);

  useEffect(() => {
    setChain([startArticle.id]);
    window.scrollTo({ top: 0 });
  }, [startArticle.id]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setChain((c) => {
            const last = c[c.length - 1];
            const idx = allArticles.findIndex((a) => a.id === last);
            const next = allArticles[(idx + 1) % allArticles.length];
            if (!next || c.includes(next.id)) return c;
            return [...c, next.id];
          });
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [chain, allArticles]);

  return (
    <div data-screen-label={`article-${startArticle.id}`}>
      <ProgressBar accent={accent} />

      {chain.map((id, idx) => {
        const article = allArticles.find((a) => a.id === id);
        if (!article) return null;
        const nextArticle = allArticles[(allArticles.findIndex((a) => a.id === id) + 1) % allArticles.length];
        const isLast = idx === chain.length - 1;
        return (
          <React.Fragment key={`${id}-${idx}`}>
            {idx > 0 && (
              <div style={{ maxWidth: "1020px", margin: "120px auto 0", padding: "0 40px" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: accent, fontWeight: 600, marginBottom: "10px" }}>
                  Next article
                </div>
                <div style={{ height: "1px", background: accent, opacity: 0.35, width: "100%" }} />
              </div>
            )}
            <ArticleBody article={article} accent={accent} tagMuted={tagMuted} measure={measure} bodyFontSize={bodyFontSize} />
            <CommentsClient slug={article.slug} accent={accent} />
            {isLast && nextArticle && (
              <>
                <NextArticlePreview article={nextArticle} tagMuted={tagMuted} />
                <div ref={sentinelRef} style={{ height: "40px" }} />
              </>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
