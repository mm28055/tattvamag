"use client";
// Admin article edit — prefilled from /api/admin/articles/[slug] (GET).
// Upload a replacement .docx or cover image, or tweak metadata in place.
// Delete button wired to DELETE on the same endpoint.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";

const CATEGORIES = [
  { slug: "history", name: "History" },
  { slug: "yoga-meditation", name: "Yoga & Meditation" },
  { slug: "art-culture", name: "Art & Culture" },
  { slug: "religion-philosophy", name: "Religion & Philosophy" },
];

type ArticleData = {
  slug: string;
  type: "essay" | "note";
  title: string;
  subtitle: string;
  categorySlug: string;
  illustrator: string;
  tags: string;
  featuredImage: string | null;
  readTime: string;
  footnoteCount: number;
  displayOrder: number | null;
  bodyHtml: string;
};

export default function AdminEditArticlePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<ArticleData | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("history");
  const [type, setType] = useState<"essay" | "note">("essay");
  const [tags, setTags] = useState("");
  const [illustrator, setIllustrator] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bodyHtml, setBodyHtml] = useState("");
  // Value loaded from the server — used to detect whether the editor changed
  // the body. Unchanged at save time → don't re-submit, which keeps the
  // canonical stored HTML intact.
  const [initialBodyHtml, setInitialBodyHtml] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/articles/${slug}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return;
        }
        if (!r.ok) throw new Error(await r.text());
        const json = await r.json();
        const a: ArticleData = json.article;
        setData(a);
        setTitle(a.title);
        setSubtitle(a.subtitle || "");
        setCategory(a.categorySlug || "history");
        setType(a.type === "note" ? "note" : "essay");
        setTags(a.tags || "");
        setIllustrator(a.illustrator || "");
        setDisplayOrder(a.displayOrder == null ? "" : String(a.displayOrder));
        setBodyHtml(a.bodyHtml || "");
        setInitialBodyHtml(a.bodyHtml || "");
      })
      .catch(() => setMessage({ kind: "error", text: "Failed to load article." }))
      .finally(() => setLoading(false));
  }, [slug]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = new FormData();
    form.append("title", title);
    form.append("subtitle", subtitle);
    form.append("category", category);
    form.append("type", type);
    form.append("tags", tags);
    form.append("illustrator", illustrator);
    form.append("displayOrder", displayOrder);
    if (file) form.append("file", file);
    // Only re-submit the body if the editor actually changed it.
    if (!file && bodyHtml && bodyHtml !== initialBodyHtml) {
      form.append("htmlBody", bodyHtml);
    }
    if (coverImage) form.append("coverImage", coverImage);

    const res = await fetch(`/api/admin/articles/${slug}`, { method: "PUT", body: form });
    setSaving(false);
    if (res.ok) {
      setMessage({ kind: "success", text: "Saved — changes are live." });
      setFile(null);
      setCoverImage(null);
      // Clear file inputs
      document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((el) => (el.value = ""));
      // Lock in the current editor contents as the new baseline so the
      // next save only re-submits if the user edits again.
      if (bodyHtml && bodyHtml !== initialBodyHtml) {
        setInitialBodyHtml(bodyHtml);
      }
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: d.error || "Save failed." });
    }
  }

  async function uploadImage(imgFile: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", imgFile);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: d.error || "Image upload failed." });
      return null;
    }
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  }

  async function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone — the article row and all its comments will be removed.`)) return;
    setDeleting(true);
    setMessage(null);
    const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/articles");
    } else {
      setDeleting(false);
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: d.error || "Delete failed." });
    }
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "#6b6259" }}>
          No article with slug <code>{slug}</code>. <Link href="/admin/articles" style={{ color: "#B83A14" }}>Back to the list</Link>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Edit article
        </h1>
        <Link
          href="/admin/articles"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6b6259",
            textDecoration: "none",
          }}
        >
          ← All articles
        </Link>
      </div>

      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13px", color: "#8b7f72", marginBottom: "24px" }}>
        <code style={{ fontFamily: "monospace" }}>{slug}</code>
        {" · "}
        <Link href={`/${slug}`} target="_blank" style={{ color: "#B83A14" }}>
          View live →
        </Link>
      </p>

      {loading ? (
        <p style={{ color: "#8b7f72", fontStyle: "italic" }}>Loading…</p>
      ) : (
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Field label="Title" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
          </Field>

          <Field label="Subtitle">
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Category" required>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
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

          <Field label="Tags" help="Comma-separated.">
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Illustrator">
            <input type="text" value={illustrator} onChange={(e) => setIllustrator(e.target.value)} style={inputStyle} />
          </Field>

          <Field
            label="Homepage position"
            help="1–7 to pin this piece to the homepage in that slot (1 = big featured, 2-4 = grid, 5-7 = more reading). Leave blank to fall back to newest-first ordering."
          >
            <input
              type="number"
              min={1}
              max={99}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="auto"
              style={{ ...inputStyle, width: "120px" }}
            />
          </Field>

          <Field
            label="Replace body (.docx)"
            help={`Optional. Uploading a .docx replaces the body below (${data?.footnoteCount ?? 0} footnote${data?.footnoteCount === 1 ? "" : "s"}, ${data?.readTime || "—"}).`}
          >
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={fileInputStyle}
            />
          </Field>

          <Field
            label="Body"
            help="Bold, italic, headings, lists, quotes, links, images with editable alt text, and inline colour. Existing footnote refs are preserved. Leave untouched to keep the current body; uploading a .docx above wins over edits here."
          >
            <RichEditor value={bodyHtml} onChange={setBodyHtml} onUploadImage={uploadImage} />
          </Field>

          <Field
            label="Replace cover image"
            help={
              data?.featuredImage
                ? "Optional. Leave blank to keep the current cover."
                : "Optional. No cover currently set."
            }
          >
            {data?.featuredImage && (
              <div style={{ marginBottom: "8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.featuredImage}
                  alt="current cover"
                  style={{
                    maxWidth: "220px",
                    maxHeight: "140px",
                    objectFit: "cover",
                    border: "1px solid #d4cdc2",
                    borderRadius: "2px",
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
              style={fileInputStyle}
            />
          </Field>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={saving || deleting}
              style={primaryBtnStyle(saving)}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={saving || deleting}
              style={dangerBtnStyle(deleting)}
            >
              {deleting ? "Deleting…" : "Delete article"}
            </button>
            {message && (
              <span
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: "13px",
                  color: message.kind === "success" ? "#4a5e3a" : "#B83A14",
                  fontStyle: "italic",
                }}
              >
                {message.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, help, required, children }: { label: string; help?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, color: "#5a5048" }}>
        {label} {required && <span style={{ color: "#B83A14" }}>*</span>}
      </span>
      {children}
      {help && (
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12.5px", color: "#8b7f72", fontStyle: "italic" }}>
          {help}
        </span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "'Source Serif 4', Georgia, serif",
  fontSize: "15px",
  padding: "10px 14px",
  border: "1px solid #d4cdc2",
  background: "#fff",
  color: "#1a1714",
  borderRadius: "2px",
  width: "100%",
};

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "8px 12px",
  fontSize: "13px",
};

function primaryBtnStyle(busy: boolean): React.CSSProperties {
  return {
    padding: "12px 24px",
    background: "#1a1714",
    color: "#FAF5E8",
    border: "none",
    cursor: busy ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
    opacity: busy ? 0.7 : 1,
    borderRadius: "2px",
  };
}

function dangerBtnStyle(busy: boolean): React.CSSProperties {
  return {
    padding: "12px 24px",
    background: "transparent",
    color: "#B83A14",
    border: "1px solid #B83A14",
    cursor: busy ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
    opacity: busy ? 0.7 : 1,
    borderRadius: "2px",
  };
}
