"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InsertImageButton } from "@/components/admin/InsertImageButton";

const CATEGORIES = [
  { slug: "history", name: "History" },
  { slug: "yoga-meditation", name: "Yoga & Meditation" },
  { slug: "art-culture", name: "Art & Culture" },
  { slug: "religion-philosophy", name: "Religion & Philosophy" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"docx" | "inline">("docx");
  const [file, setFile] = useState<File | null>(null);
  const [markdownBody, setMarkdownBody] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("history");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<"essay" | "note">("essay");
  const [illustrator, setIllustrator] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "docx" && !file) {
      setError("Please choose a .docx file (or switch to Write inline).");
      return;
    }
    if (mode === "inline" && !markdownBody.trim()) {
      setError("Type an article body (or switch to Upload .docx).");
      return;
    }
    if (!title) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    if (mode === "docx" && file) form.append("file", file);
    if (mode === "inline") form.append("markdownBody", markdownBody);
    if (coverImage) form.append("coverImage", coverImage);
    form.append("title", title);
    form.append("subtitle", subtitle);
    form.append("category", category);
    form.append("tags", tags);
    form.append("type", type);
    form.append("illustrator", illustrator);
    form.append("slug", slug);

    const res = await fetch("/api/admin/articles", { method: "POST", body: form });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/${data.slug}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed.");
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-12 pb-24">
      <div className="flex items-baseline justify-between mb-6">
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "32px",
            fontWeight: 700,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Publish a new article
        </h1>
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "12px",
            color: "var(--color-meta)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
          className="hover:text-[color:var(--color-accent)]"
        >
          ← Back
        </Link>
      </div>

      <p
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "15px",
          color: "var(--color-meta)",
          marginBottom: "28px",
          lineHeight: 1.7,
        }}
      >
        Two ways to publish: upload a Word <code>.docx</code> (footnotes preserved, bibliography intact),
        or type the body directly in markdown. Pick whichever is quicker for the piece. A cover image is
        optional either way.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Mode toggle: upload a Word doc OR type the body directly. */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "2px" }}>
          <button type="button" onClick={() => setMode("docx")} style={tabStyle(mode === "docx")}>
            Upload .docx
          </button>
          <button type="button" onClick={() => setMode("inline")} style={tabStyle(mode === "inline")}>
            Write inline
          </button>
        </div>

        {mode === "docx" ? (
          <Field label="Word document (.docx)" required help="Footnotes (Insert → Footnote) are preserved as proper references. Bibliographies come through as-is.">
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={fileInputStyle}
            />
          </Field>
        ) : (
          <Field
            label="Body (markdown)"
            required
            help={`Paragraphs: separate with a blank line. Formatting: # Heading, ## Subheading, **bold**, *italic*, [link](https://…), > quote. Footnotes: [^1] in the text and [^1]: your note at the bottom.`}
          >
            <textarea
              ref={bodyRef}
              value={markdownBody}
              onChange={(e) => setMarkdownBody(e.target.value)}
              rows={20}
              placeholder={`# Opening heading\n\nYour first paragraph with a footnote[^1].\n\n## A subheading\n\nMore body text, with **bold** or *italic* when you need it.\n\n[^1]: This is the footnote. It can contain *emphasis* or [links](https://example.org).`}
              style={{ ...inputStyle, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.6, resize: "vertical" }}
            />
            <InsertImageButton getTextarea={() => bodyRef.current} onChange={setMarkdownBody} />
          </Field>
        )}

        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Role of Mantra in Tantric Hinduism"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Subtitle" help="A single-line deck shown under the title.">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" required>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as "essay" | "note")} style={inputStyle}>
              <option value="essay">Essay (long-form)</option>
              <option value="note">Note (short notebook entry)</option>
            </select>
          </Field>
        </div>

        <Field label="Tags" help="Comma-separated, e.g. “shaivism, epigraphy, bhakti”">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Illustrator" help="Optional — credit under the cover image.">
          <input
            type="text"
            value={illustrator}
            onChange={(e) => setIllustrator(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Cover image" help="JPG, PNG, or WebP. Optional — articles render fine without.">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            style={fileInputStyle}
          />
        </Field>

        <Field label="Custom URL slug" help="Optional. Auto-generated from the title if blank.">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. mantra-in-tantric-hinduism"
            style={inputStyle}
          />
        </Field>

        <div className="flex items-center gap-4 mt-2">
          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "12px 24px",
              background: "var(--color-ink)",
              color: "#FAF8F4",
              border: "none",
              borderRadius: "2px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
          {error && (
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "13px",
                color: "var(--color-accent)",
                fontStyle: "italic",
              }}
            >
              {error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required, help }: { label: string; children: React.ReactNode; required?: boolean; help?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-meta)",
          fontWeight: 500,
        }}
      >
        {label} {required && <span style={{ color: "var(--color-accent)" }}>*</span>}
      </span>
      {children}
      {help && (
        <span
          style={{
            fontFamily: "var(--font-reading), serif",
            fontSize: "12.5px",
            color: "var(--color-meta-faded)",
            fontStyle: "italic",
            marginTop: "2px",
          }}
        >
          {help}
        </span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: "14px",
  padding: "10px 14px",
  border: "1px solid var(--color-tag-border)",
  background: "var(--color-bg)",
  color: "var(--color-ink)",
  borderRadius: "2px",
  width: "100%",
};

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "8px 12px",
  fontSize: "13px",
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    border: "none",
    borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
    background: "transparent",
    color: active ? "var(--color-accent)" : "var(--color-meta)",
    fontFamily: "var(--font-sans), sans-serif",
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
  };
}
