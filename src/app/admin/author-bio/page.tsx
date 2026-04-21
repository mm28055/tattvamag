"use client";
// Author bio shown in the red box at the end of every article. Plain text —
// one block, edited here, rendered verbatim on the reader page.
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAuthorBioPage() {
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/author-bio")
      .then((r) => r.json())
      .then((d) => {
        setBio(d.bio || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/author-bio", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ kind: "success", text: "Saved — changes are live." });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: data.error || "Could not save." });
    }
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Edit author bio
        </h1>
        <Link
          href="/admin"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6b6259",
            textDecoration: "none",
          }}
        >
          ← Back to admin
        </Link>
      </div>

      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "14px", color: "#6b6259", marginBottom: "24px", lineHeight: 1.6 }}>
        This shows in the red-bordered box at the end of every essay, right below the share buttons.
        Keep it short — 2-3 sentences.
      </p>

      {loading ? (
        <p style={{ color: "#8b7f72", fontStyle: "italic" }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "#5a5048",
              }}
            >
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "15px",
                padding: "12px 14px",
                border: "1px solid #d4cdc2",
                background: "#fff",
                color: "#1a1714",
                borderRadius: "2px",
                lineHeight: 1.6,
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "12px 24px",
                background: "#1a1714",
                color: "#FAF5E8",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
                borderRadius: "2px",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
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
        </div>
      )}
    </div>
  );
}
