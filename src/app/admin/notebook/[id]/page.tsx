"use client";
// Edit an existing notebook entry. Prefilled from GET /api/admin/notebook/[id].
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { InsertImageButton } from "@/components/admin/InsertImageButton";

type EntryData = {
  id: string;
  title: string;
  body: string;
  tags: string;
  datePublished: string;
  displayOrder: number | null;
};

export default function EditNotebookEntryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [datePublished, setDatePublished] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/admin/notebook/${id}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        if (!r.ok) throw new Error(await r.text());
        const json = await r.json();
        const e: EntryData = json.entry;
        setTitle(e.title);
        setBody(e.body);
        setTags(e.tags);
        setDatePublished(e.datePublished);
        setDisplayOrder(e.displayOrder == null ? "" : String(e.displayOrder));
      })
      .catch(() => setMessage({ kind: "error", text: "Failed to load entry." }))
      .finally(() => setLoading(false));
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/notebook/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        datePublished,
        displayOrder: displayOrder === "" ? null : displayOrder,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ kind: "success", text: "Saved — changes are live." });
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: d.error || "Save failed." });
    }
  }

  async function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setMessage(null);
    const res = await fetch(`/api/admin/notebook/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/notebook");
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
          No entry with id <code>{id}</code>. <Link href="/admin/notebook" style={{ color: "#B83A14" }}>Back to the list</Link>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Edit notebook entry
        </h1>
        <Link href="/admin/notebook" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6259", textDecoration: "none" }}>
          ← All entries
        </Link>
      </div>

      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13px", color: "#8b7f72", marginBottom: "24px" }}>
        <code style={{ fontFamily: "monospace" }}>{id}</code>
      </p>

      {loading ? (
        <p style={{ color: "#8b7f72", fontStyle: "italic" }}>Loading…</p>
      ) : (
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Field label="Title" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
          </Field>

          <Field label="Body" required help="Markdown. Blank line = new paragraph. **bold**, *italic*, # heading, > quote, [link](url), ![image](url).">
            <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} rows={16} style={{ ...inputStyle, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.6, resize: "vertical" }} required />
            <InsertImageButton getTextarea={() => bodyRef.current} onChange={setBody} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <Field label="Tags">
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Date">
              <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Pin slot" help="Optional 1-N to pin.">
              <input type="number" min={1} max={99} value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="auto" style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
            <button type="submit" disabled={saving || deleting} style={primaryBtnStyle(saving)}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={remove} disabled={saving || deleting} style={dangerBtnStyle(deleting)}>
              {deleting ? "Deleting…" : "Delete entry"}
            </button>
            {message && (
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13px", color: message.kind === "success" ? "#4a5e3a" : "#B83A14", fontStyle: "italic" }}>
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
