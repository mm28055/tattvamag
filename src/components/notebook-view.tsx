"use client";
// Notebook page: stream of dated fragments. Ported from Notebook.jsx.
import React, { useEffect, useRef } from "react";
import type { FrontendNotebookEntry, Block } from "@/lib/frontend-types";

export default function NotebookView({ entries, accent, tagMuted }: { entries: FrontendNotebookEntry[]; accent: string; tagMuted: string }) {
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    // If there's a hash, scroll to it
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = refs.current[hash];
    if (!el) return;
    const t = setTimeout(() => {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{ padding: "0 0 100px" }}>
      {/* Header */}
      <header style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 40px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: accent, fontWeight: 600, marginBottom: "14px" }}>
          The Notebook
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "44px", fontStyle: "italic", fontWeight: 500, color: "#1a1714", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          Fragments, marginalia, works in progress
        </h1>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "16px", lineHeight: 1.7, color: "#6b6259", marginTop: "20px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
          Shorter pieces than the essays — notes from reading, translations, questions held open. Updated when there is something worth writing down.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ maxWidth: "600px", margin: "0 auto 72px", padding: "0 32px" }}>
        <div style={{ height: "1px", background: accent, opacity: 0.3, width: "60px" }} />
      </div>

      {/* Stream */}
      <div>
        {entries.map((entry, i) => (
          <NotebookEntryBlock
            key={entry.id}
            entry={entry}
            accent={accent}
            tagMuted={tagMuted}
            isLast={i === entries.length - 1}
            anchorRef={(el) => {
              refs.current[entry.id] = el;
            }}
          />
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "18px", color: "#8b7f72" }}>
          No notebook entries yet.
        </div>
      )}
    </main>
  );
}

function NotebookEntryBlock({
  entry,
  accent,
  tagMuted,
  isLast,
  anchorRef,
}: {
  entry: FrontendNotebookEntry;
  accent: string;
  tagMuted: string;
  isLast: boolean;
  anchorRef: (el: HTMLElement | null) => void;
}) {
  const blocks: Block[] = Array.isArray(entry.body)
    ? (entry.body as Block[])
    : (entry.body as string)
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ type: "p", text } as Block));

  return (
    <article
      ref={anchorRef as React.Ref<HTMLElement>}
      id={entry.id}
      data-notebook-id={entry.id}
      style={{ maxWidth: "600px", margin: "0 auto", padding: "0 32px", marginBottom: isLast ? 0 : "88px" }}
    >
      {/* Date kicker */}
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: "#8b7f72", marginBottom: "14px", letterSpacing: "0.01em" }}>
        {entry.datePublished || ""}
      </div>

      {/* Title */}
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", lineHeight: 1.22, fontWeight: 500, color: "#1a1714", margin: "0 0 18px", letterSpacing: "-0.005em" }}>
        {entry.title}
      </h2>

      {/* Body */}
      <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "16.5px", lineHeight: 1.72, color: "#2a2520" }}>
        {blocks.map((b, i) => {
          if (b.type === "image") {
            const aspect = b.aspectRatio || "3 / 2";
            return (
              <figure key={i} style={{ margin: i === 0 ? "0 0 4px" : "28px 0 4px" }}>
                {b.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.src} alt={b.label || b.caption || ""} style={{ width: "100%", aspectRatio: aspect, objectFit: "cover", display: "block", filter: "sepia(0.1) saturate(0.92)" }} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: aspect,
                      background: "linear-gradient(180deg, #e8dfd2 0%, #d8ccb8 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#6b5b4a", fontWeight: 500 }}>
                      {b.label || "Image"}
                    </span>
                  </div>
                )}
                {b.caption && (
                  <figcaption style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13.5px", color: "#8b7f72", textAlign: "center", marginTop: "10px", lineHeight: 1.5 }}>
                    {b.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          if (b.type === "quote" || b.type === "pullquote") {
            return (
              <blockquote key={i} style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "18px", lineHeight: 1.5, color: "#3a332c", margin: i === 0 ? "0" : "22px 0 0", padding: "0 0 0 20px", borderLeft: `2px solid ${accent}` }}>
                {b.text}
              </blockquote>
            );
          }
          if (b.type === "h2") {
            return (
              <h3 key={i} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontStyle: "italic", fontWeight: 500, color: "#1a1714", marginTop: "24px", marginBottom: "8px" }}>
                {b.text}
              </h3>
            );
          }
          return (
            <p key={i} style={{ margin: i === 0 ? 0 : "1em 0 0" }}>
              {b.text}
            </p>
          );
        })}
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px", fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", color: tagMuted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
          {entry.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </article>
  );
}
