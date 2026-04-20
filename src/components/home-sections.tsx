"use client";
// Home-page sections, ported from Sections.jsx.
// All cards link to /[slug]; tags link to /archive?tab=...&tag=...
import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { truncate, Tags, TagAsLink, ByLine, Ornament } from "./common";
import type { FrontendArticle, FrontendNotebookEntry, FrontendEpigraph } from "@/lib/frontend-types";

// ══ FEATURED ESSAY (split or centered) ══
export function FeaturedEssay({
  essay,
  accent,
  tagMuted,
  layout,
}: {
  essay: FrontendArticle;
  accent: string;
  tagMuted: string;
  layout: "split" | "centered";
}) {
  const [hover, setHover] = useState(false);
  const excerpt = truncate(essay.body, 540);

  const titleEl = (
    <h2
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: layout === "split" ? "44px" : "46px",
        fontWeight: 600,
        lineHeight: layout === "split" ? 1.14 : 1.15,
        color: hover ? accent : "#1a1714",
        margin: 0,
        transition: "color 0.3s ease",
        letterSpacing: "-0.005em",
      }}
    >
      {essay.title}
    </h2>
  );

  const subtitleEl = essay.subtitle ? (
    <p
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: layout === "split" ? "19px" : "21px",
        fontStyle: "italic",
        color: "#554a40",
        marginTop: layout === "split" ? "16px" : "18px",
        lineHeight: layout === "split" ? 1.5 : 1.45,
      }}
    >
      {essay.subtitle}
    </p>
  ) : null;

  if (layout === "split") {
    return (
      <section
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ padding: "56px 0 56px", borderBottom: "1px solid #ddd8cf" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <Link href={`/${essay.slug}` as Route} style={{ textDecoration: "none", cursor: "pointer" }}>
            <div style={{ marginBottom: "20px" }}>
              <TagAsLink tags={essay.tags} muted={tagMuted} />
            </div>
            {titleEl}
            {subtitleEl}
            <Ornament accent={accent} width={40} margin="24px 0 0" />
            <ByLine author={essay.author} readTime={essay.readTime} />
          </Link>
          <Link href={`/${essay.slug}` as Route} style={{ textDecoration: "none", cursor: "pointer" }}>
            <div style={{ marginBottom: "20px", visibility: "hidden" }} aria-hidden>
              <Tags tags={essay.tags} muted={tagMuted} />
            </div>
            <p
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "17px",
                lineHeight: 1.8,
                color: "#3a3530",
                margin: 0,
              }}
            >
              {excerpt}
            </p>
          </Link>
        </div>
      </section>
    );
  }

  // centered
  return (
    <section
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ padding: "68px 0 60px", borderBottom: "1px solid #ddd8cf" }}
    >
      <Link
        href={`/${essay.slug}` as Route}
        style={{ display: "block", maxWidth: "680px", margin: "0 auto", textAlign: "center", textDecoration: "none", cursor: "pointer" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <TagAsLink tags={essay.tags} muted={tagMuted} />
        </div>
        {titleEl}
        {subtitleEl}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Ornament accent={accent} width={44} margin="26px 0" />
        </div>
        <p
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "#3a3530",
            margin: 0,
            textAlign: "left",
          }}
        >
          {excerpt}
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ByLine author={essay.author} readTime={essay.readTime} />
        </div>
      </Link>
    </section>
  );
}

// ══ SECONDARY GRID ══
export function SecondaryGrid({
  essays,
  accent,
  tagMuted,
}: {
  essays: FrontendArticle[];
  accent: string;
  tagMuted: string;
}) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0",
        borderBottom: "1px solid #ddd8cf",
      }}
    >
      {essays.map((essay, i) => (
        <SecondaryCard key={essay.id} essay={essay} accent={accent} tagMuted={tagMuted} position={i} total={essays.length} />
      ))}
    </section>
  );
}

function SecondaryCard({
  essay,
  accent,
  tagMuted,
  position,
  total,
}: {
  essay: FrontendArticle;
  accent: string;
  tagMuted: string;
  position: number;
  total: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "40px 30px",
        paddingLeft: position === 0 ? 0 : "30px",
        paddingRight: position === total - 1 ? 0 : "30px",
        borderRight: position < total - 1 ? "1px solid #e2ddd5" : "none",
      }}
    >
      <Link href={`/${essay.slug}` as Route} style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "block" }}>
        <TagAsLink tags={essay.tags} muted={tagMuted} />
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 600,
            lineHeight: 1.28,
            color: hover ? accent : "#1a1714",
            margin: "12px 0 0",
            transition: "color 0.3s ease",
          }}
        >
          {essay.title}
        </h3>
        {essay.subtitle && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#6a5e54", marginTop: "8px", fontStyle: "italic", lineHeight: 1.45 }}>
            {essay.subtitle}
          </p>
        )}
        <Ornament accent={accent} margin="18px 0 0" />
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14.5px", lineHeight: 1.7, color: "#5a554e", marginTop: "14px" }}>
          {truncate(essay.body, 260)}
        </p>
        <ByLine author={essay.author} readTime={essay.readTime} />
      </Link>
    </article>
  );
}

// ══ MORE READING ══
export function MoreReadingSection({
  articles,
  accent,
  tagMuted,
}: {
  articles: FrontendArticle[];
  accent: string;
  tagMuted: string;
}) {
  const [aTop, aBottom, b] = articles;
  if (!aTop || !aBottom || !b) return null;
  const anyImage = !!b.image;
  const expandedLen = 820;

  return (
    <section style={{ borderBottom: "1px solid #ddd8cf" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "40px", marginBottom: "18px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 500, color: "#1a1714", fontStyle: "italic" }}>
          More Reading
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a89e", fontWeight: 500 }}>
          Essays {anyImage ? "· with imagery" : "in progress"}
        </div>
      </div>
      <div style={{ height: "1px", background: "#e2ddd5", marginBottom: "8px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "stretch" }}>
        <div style={{ borderRight: "1px solid #e2ddd5" }}>
          <ColumnACard article={aTop} accent={accent} tagMuted={tagMuted} isFirst={true} />
          <ColumnACard article={aBottom} accent={accent} tagMuted={tagMuted} isFirst={false} />
        </div>
        <ColumnBCard article={b} accent={accent} tagMuted={tagMuted} expandedLen={expandedLen} />
      </div>
    </section>
  );
}

function ColumnACard({ article, accent, tagMuted, isFirst }: { article: FrontendArticle; accent: string; tagMuted: string; isFirst: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ padding: "30px 36px 30px 0", borderBottom: isFirst ? "1px solid #e8e4dc" : "none" }}
    >
      <Link href={`/${article.slug}` as Route} style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "block" }}>
        <TagAsLink tags={article.tags} muted={tagMuted} />
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "24px",
            fontWeight: 600,
            lineHeight: 1.25,
            color: hover ? accent : "#1a1714",
            margin: "10px 0 0",
            transition: "color 0.3s ease",
          }}
        >
          {article.title}
        </h3>
        {article.subtitle && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontStyle: "italic", color: "#6a5e54", marginTop: "8px", lineHeight: 1.45 }}>
            {article.subtitle}
          </p>
        )}
        <Ornament accent={accent} margin="18px 0 0" />
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14.5px", lineHeight: 1.7, color: "#5a554e", marginTop: "12px" }}>
          {truncate(article.body, 200)}
        </p>
        <ByLine author={article.author} readTime={article.readTime} />
      </Link>
    </article>
  );
}

function ColumnBCard({
  article,
  accent,
  tagMuted,
  expandedLen,
}: {
  article: FrontendArticle;
  accent: string;
  tagMuted: string;
  expandedLen: number;
}) {
  const [hover, setHover] = useState(false);
  const showImage = !!article.image;
  const body = showImage ? truncate(article.body, 260) : truncate(article.body, expandedLen);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ padding: "30px 0 30px 36px", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Link href={`/${article.slug}` as Route} style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", height: "100%" }}>
        {showImage && article.image?.src && (
          <div style={{ marginBottom: "22px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image.src}
              alt={article.image.label || article.title}
              style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block" }}
            />
          </div>
        )}
        <TagAsLink tags={article.tags} muted={tagMuted} />
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 600,
            lineHeight: 1.22,
            color: hover ? accent : "#1a1714",
            margin: "10px 0 0",
            transition: "color 0.3s ease",
            letterSpacing: "-0.003em",
          }}
        >
          {article.title}
        </h3>
        {article.subtitle && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#6a5e54", marginTop: "10px", lineHeight: 1.45 }}>
            {article.subtitle}
          </p>
        )}
        <Ornament accent={accent} margin="20px 0 0" />
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.75, color: "#4a4540", marginTop: "14px", flex: showImage ? "initial" : 1 }}>
          {body}
        </p>
        <ByLine author={article.author} readTime={article.readTime} />
      </Link>
    </article>
  );
}

// ══ QUOTE SEPARATOR (epigraph) ══
export function QuoteSeparator({ quote, accent }: { quote: FrontendEpigraph; accent: string }) {
  return (
    <section className="tm-quote" style={{ padding: "48px 0 48px", borderBottom: "1px solid #ddd8cf", textAlign: "center" }}>
      <div style={{ maxWidth: "620px", margin: "0 auto" }}>
        <div style={{ width: "40px", height: "1.5px", background: accent, margin: "0 auto 48px" }} />
        <div
          className="tm-quote-body"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "22px",
            lineHeight: 1.7,
            color: "#2a2520",
          }}
        >
          {quote.lines.map((line, i) =>
            line === "" ? (
              <div key={i} style={{ height: "14px" }} />
            ) : (
              <div key={i}>{line}</div>
            )
          )}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9e958a", marginTop: "32px", fontWeight: 500 }}>
          — {quote.attribution}
        </div>
        <div style={{ width: "40px", height: "1.5px", background: accent, margin: "48px auto 0" }} />
      </div>
    </section>
  );
}

// ══ NOTEBOOK PREVIEW (home page) ══
export function NotebookSection({
  entries,
  accent,
  tagMuted,
}: {
  entries: FrontendNotebookEntry[];
  accent: string;
  tagMuted: string;
}) {
  const shown = entries.slice(0, 4);
  return (
    <section style={{ paddingTop: "8px", paddingBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "40px", marginBottom: "18px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 500, color: "#1a1714", fontStyle: "italic" }}>
          From the Notebook
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0a89e", fontWeight: 500 }}>
          Marginalia & fragments
        </div>
      </div>
      <div style={{ height: "1px", background: "#e2ddd5", marginBottom: "4px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "56px" }}>
        {shown.map((entry, i) => (
          <NotebookPreviewCard key={entry.id} entry={entry} accent={accent} tagMuted={tagMuted} i={i} total={shown.length} />
        ))}
      </div>
    </section>
  );
}

function NotebookPreviewCard({ entry, accent, tagMuted, i, total }: { entry: FrontendNotebookEntry; accent: string; tagMuted: string; i: number; total: number }) {
  const [hover, setHover] = useState(false);
  const isRight = i % 2 === 1;
  const firstPara =
    typeof entry.body === "string"
      ? entry.body.split(/\n\n+/)[0]
      : (entry.body.find((b) => b.type === "p") as { text: string } | undefined)?.text || "";
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "26px 0",
        paddingLeft: isRight ? "28px" : 0,
        paddingRight: !isRight ? "28px" : 0,
        borderRight: !isRight ? "1px solid #e8e4dc" : "none",
        borderBottom: i < total - 2 ? "1px solid #e8e4dc" : "none",
      }}
    >
      <Link href={`/notebook#${entry.id}` as Route} style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "block" }}>
        <Tags tags={entry.tags} muted={tagMuted} />
        <h4
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontStyle: "italic",
            lineHeight: 1.32,
            color: hover ? accent : "#2c2520",
            margin: "10px 0 0",
            transition: "color 0.3s ease",
            fontWeight: 500,
          }}
        >
          {entry.title}
        </h4>
        <Ornament accent={accent} margin="14px 0 0" />
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14px", lineHeight: 1.7, color: "#6b6259", marginTop: "10px", marginBottom: 0 }}>
          {firstPara}
        </p>
      </Link>
    </article>
  );
}
