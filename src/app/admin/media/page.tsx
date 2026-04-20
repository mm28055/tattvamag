"use client";
// Admin media library — upload, copy URL, delete. Grid view.
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type MediaItem = {
  id: number;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  uploadedAt: string;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await fetch("/api/admin/media");
    if (res.ok) {
      const data = await res.json();
      setItems(data.media);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Upload failed.");
    } else {
      await refresh();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyUrl(item: MediaItem) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((cur) => (cur === item.id ? null : cur)), 2000);
    } catch {
      setError("Clipboard copy failed — select the URL manually.");
    }
  }

  async function remove(item: MediaItem) {
    if (!confirm(`Delete ${item.filename}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Delete failed.");
      return;
    }
    setItems((cur) => cur.filter((x) => x.id !== item.id));
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Media library
        </h1>
        <Link href="/admin" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6259", textDecoration: "none" }}>
          ← Back to admin
        </Link>
      </div>
      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "14px", color: "#6b6259", marginBottom: "24px", lineHeight: 1.6 }}>
        Upload standalone images here, then copy the URL to paste into an article body (markdown: <code>{`![alt](url)`}</code>) or use anywhere else.
      </p>

      <div
        style={{
          border: "1px dashed #c4b9a8",
          borderRadius: "2px",
          padding: "24px",
          background: "#faf5e8",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFilePicked} disabled={uploading} style={{ flex: 1 }} />
        {uploading && (
          <span style={{ fontFamily: "'Source Serif 4', serif", fontStyle: "italic", color: "#6b6259", fontSize: "13px" }}>
            Uploading…
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: "#B83A14", fontFamily: "'Source Serif 4', serif", fontSize: "13px", fontStyle: "italic", marginBottom: "16px" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ color: "#8b7f72", fontStyle: "italic" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "#6b6259", textAlign: "center", padding: "40px 0" }}>
          No images yet. Pick one above to upload.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e8e2d6",
                borderRadius: "2px",
                background: "#fff",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.altText || item.filename}
                style={{ width: "100%", height: "160px", objectFit: "cover", display: "block", background: "#f0eadd" }}
              />
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "12px",
                    color: "#1a1714",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.filename}
                >
                  {item.filename}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#8b7f72" }}>
                  {formatSize(item.sizeBytes)}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => copyUrl(item)}
                    style={smallBtnStyle(false)}
                  >
                    {copiedId === item.id ? "Copied ✓" : "Copy URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    style={smallBtnStyle(true)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function smallBtnStyle(danger: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "6px 10px",
    background: danger ? "transparent" : "#1a1714",
    color: danger ? "#B83A14" : "#FAF5E8",
    border: danger ? "1px solid #B83A14" : "none",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "10.5px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 600,
    borderRadius: "2px",
  };
}
