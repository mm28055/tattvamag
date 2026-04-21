"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAuthorBioPage() {
  const [bios, setBios] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/admin/author-bio")
      .then((r) => r.json())
      .then((d) => {
        setBios(d.bios || {});
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
      body: JSON.stringify({ bios }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ kind: "success", text: "Saved — changes are live." });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: data.error || "Could not save." });
    }
  }

  function updateBio(name: string, text: string) {
    setBios((prev) => ({ ...prev, [name]: text }));
  }

  function removeBio(name: string) {
    setBios((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function addAuthor() {
    const name = newName.trim();
    if (!name || bios[name] !== undefined) return;
    setBios((prev) => ({ ...prev, [name]: "" }));
    setNewName("");
  }

  const authors = Object.keys(bios);

  const fieldLabel: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#5a5048",
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Author bios
        </h1>
        <Link href="/admin" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6259", textDecoration: "none" }}>
          ← Back to admin
        </Link>
      </div>

      <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "14px", color: "#6b6259", marginBottom: "32px", lineHeight: 1.6 }}>
        Each author bio appears in the archive when filtering by that author. Keep it 2–3 sentences.
      </p>

      {loading ? (
        <p style={{ color: "#8b7f72", fontStyle: "italic" }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {authors.length === 0 && (
            <p style={{ color: "#8b7f72", fontStyle: "italic", fontFamily: "'Source Serif 4', serif", fontSize: "14px" }}>No author bios yet. Add one below.</p>
          )}

          {authors.map((name) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={fieldLabel}>{name}</span>
                <button
                  onClick={() => removeBio(name)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#B83A14", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={bios[name]}
                onChange={(e) => updateBio(name, e.target.value)}
                rows={4}
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", padding: "12px 14px", border: "1px solid #d4cdc2", background: "#fff", color: "#1a1714", borderRadius: "2px", lineHeight: 1.6, resize: "vertical" }}
              />
            </div>
          ))}

          {/* Add author */}
          <div style={{ borderTop: "1px solid #d8d2c8", paddingTop: "24px" }}>
            <div style={{ ...fieldLabel, display: "block", marginBottom: "8px" }}>Add author</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAuthor()}
                placeholder="Full name"
                style={{ flex: 1, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", padding: "10px 14px", border: "1px solid #d4cdc2", background: "#fff", color: "#1a1714", borderRadius: "2px" }}
              />
              <button
                onClick={addAuthor}
                style={{ padding: "10px 20px", background: "#1a1714", color: "#FAF5E8", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, borderRadius: "2px" }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Save */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: "12px 24px", background: "#1a1714", color: "#FAF5E8", border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, opacity: saving ? 0.7 : 1, borderRadius: "2px" }}
            >
              {saving ? "Saving…" : "Save all"}
            </button>
            {message && (
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: "13px", color: message.kind === "success" ? "#4a5e3a" : "#B83A14", fontStyle: "italic" }}>
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
