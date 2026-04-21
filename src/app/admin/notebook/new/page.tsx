"use client";
// Quick notebook entry composer. No .docx required — just type.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotebookRichEditor from "@/components/admin/NotebookRichEditor";

export default function NewNotebookEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [datePublished, setDatePublished] = useState(new Date().toISOString().slice(0, 10));
  const [customId, setCustomId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(imgFile: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", imgFile);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Image upload failed.");
      return null;
    }
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    if (!body.replace(/<[^>]+>/g, "").trim()) { setError("Body is required."); return; }
    setSubmitting(true);
    const res = await fetch("/api/admin/notebook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        datePublished,
        id: customId.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push("/admin/notebook");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not save.");
    }
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          New notebook entry
        </h1>
        <Link href="/admin/notebook" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6259", textDecoration: "none" }}>
          ← All entries
        </Link>
      </div>
      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13.5px", color: "#6b6259", marginBottom: "24px", lineHeight: 1.6 }}>
        Short journal posts — fragments, marginalia, works in progress. Use the toolbar for bold, italic, headings, quotes, lists, links, and images.
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Field label="Title" required>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        </Field>

        <Field as="div" label="Body" required help="Bold, italic, headings, quotes, lists, links, and images — all inline. Press Enter for a new paragraph.">
          <NotebookRichEditor value={body} onChange={setBody} onUploadImage={uploadImage} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Tags" help="Comma-separated.">
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Hermeneutics, Sanskrit" style={inputStyle} />
          </Field>
          <Field label="Date" help="When this entry should appear as published.">
            <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <Field label="Custom URL id" help="Optional — auto-generated from the title if blank.">
          <input type="text" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="on-gadamer-prejudice" style={inputStyle} />
        </Field>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
          <button type="submit" disabled={submitting} style={primaryBtnStyle(submitting)}>
            {submitting ? "Publishing…" : "Publish entry"}
          </button>
          {error && (
            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13px", color: "#B83A14", fontStyle: "italic" }}>
              {error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, help, required, children, as }: { label: string; help?: string; required?: boolean; children: React.ReactNode; as?: "label" | "div" }) {
  // `as="div"` for fields that wrap a contenteditable — a <label> would
  // redirect clicks to the first labelable element inside (a toolbar button).
  const Tag = as || "label";
  return (
    <Tag style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, color: "#5a5048" }}>
        {label} {required && <span style={{ color: "#B83A14" }}>*</span>}
      </span>
      {children}
      {help && (
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12.5px", color: "#8b7f72", fontStyle: "italic" }}>
          {help}
        </span>
      )}
    </Tag>
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
