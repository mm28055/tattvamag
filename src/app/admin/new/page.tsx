"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "history", name: "History" },
  { slug: "yoga-meditation", name: "Yoga & Meditation" },
  { slug: "art-culture", name: "Art & Culture" },
  { slug: "religion-philosophy", name: "Religion & Philosophy" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a .docx file.");
      return;
    }
    if (!title) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append("file", file);
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
        Upload a Word <code>.docx</code> file. Footnotes (Insert → Footnote) will be preserved as
        proper references. Bibliography sections and citations come through as-is. A cover image is
        optional.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Word document (.docx)" required>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            style={fileInputStyle}
          />
        </Field>

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
