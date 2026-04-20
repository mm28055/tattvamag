"use client";
// Small helper used by the markdown composer on /admin/new and /admin/articles/[slug].
// Pick a file → uploads to /api/admin/media → inserts `![alt](url)` at the textarea's
// current cursor position.
import { useRef, useState } from "react";

export function InsertImageButton({
  getTextarea,
  onChange,
}: {
  getTextarea: () => HTMLTextAreaElement | null;
  onChange: (nextValue: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Upload failed");
      }
      const data = await res.json();
      const snippet = `\n\n![${file.name.replace(/\.[^.]+$/, "")}](${data.url})\n\n`;
      insertAtCursor(getTextarea(), snippet, onChange);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "-8px", marginBottom: "-4px" }}>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        style={{
          padding: "6px 12px",
          background: "transparent",
          color: busy ? "#a69788" : "#B83A14",
          border: "1px solid #B83A14",
          cursor: busy ? "wait" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "10.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
          borderRadius: "2px",
        }}
      >
        {busy ? "Uploading…" : "+ Insert image"}
      </button>
      <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12px", color: "#8b7f72", fontStyle: "italic" }}>
        Uploads to the media library and pastes a markdown image tag at your cursor.
      </span>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onPicked} style={{ display: "none" }} />
      {error && (
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12px", color: "#B83A14", fontStyle: "italic" }}>
          {error}
        </span>
      )}
    </div>
  );
}

function insertAtCursor(el: HTMLTextAreaElement | null, text: string, onChange: (v: string) => void) {
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const next = before + text + after;
  onChange(next);
  // Restore cursor to just after the inserted snippet.
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
  });
}
