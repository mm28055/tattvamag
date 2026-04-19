"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Row = {
  id: number;
  article_slug: string;
  name: string;
  email: string | null;
  body: string;
  is_approved: boolean;
  created_at: string;
};

export default function ModerationPage() {
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/comments?filter=${filter}`);
    if (r.ok) {
      const d = await r.json();
      setRows(d.comments || []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: number) {
    setBusyId(id);
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action: "approve" }),
    });
    setBusyId(null);
    await load();
  }

  async function del(id: number) {
    if (!confirm("Delete this comment?")) return;
    setBusyId(id);
    await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
    await load();
  }

  return (
    <div className="max-w-[880px] mx-auto px-6 pt-12 pb-24">
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
          Comments
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

      <div className="flex gap-2 mb-6">
        {(["pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "18px",
              border: `1px solid ${filter === f ? "var(--color-accent)" : "var(--color-tag-border)"}`,
              color: filter === f ? "var(--color-accent)" : "var(--color-meta)",
              background: "transparent",
              cursor: "pointer",
              textTransform: "capitalize",
              letterSpacing: "0.04em",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-reading), serif", color: "var(--color-meta)" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-reading), serif",
            fontSize: "15px",
            color: "var(--color-meta)",
            fontStyle: "italic",
            textAlign: "center",
            padding: "60px 0",
          }}
        >
          No {filter} comments.
        </p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li
              key={r.id}
              className="py-5"
              style={{ borderTop: "1px solid var(--color-divider-soft)" }}
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "var(--color-ink)",
                  }}
                >
                  {r.name}
                </span>
                {r.email && (
                  <span
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "12px",
                      color: "var(--color-meta-faded)",
                    }}
                  >
                    {r.email}
                  </span>
                )}
                <Link
                  href={`/${r.article_slug}`}
                  target="_blank"
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    marginLeft: "auto",
                  }}
                  className="hover:underline"
                >
                  /{r.article_slug}
                </Link>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-reading), serif",
                  fontSize: "15px",
                  lineHeight: 1.75,
                  color: "var(--color-body-muted)",
                  whiteSpace: "pre-wrap",
                  margin: "0 0 10px",
                }}
              >
                {r.body}
              </p>
              <div
                className="flex items-center gap-3"
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "12px",
                  color: "var(--color-meta-faded)",
                }}
              >
                <span>{new Date(r.created_at).toLocaleString()}</span>
                <span style={{ color: "var(--color-tag-border)" }}>·</span>
                {!r.is_approved && (
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    disabled={busyId === r.id}
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-accent)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      opacity: busyId === r.id ? 0.5 : 1,
                    }}
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => del(r.id)}
                  disabled={busyId === r.id}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-meta)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    opacity: busyId === r.id ? 0.5 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
