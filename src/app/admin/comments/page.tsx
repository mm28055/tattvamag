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

type ArticleOption = { slug: string; title: string; date: string };

export default function ModerationPage() {
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/comments?filter=${filter}`);
    if (r.ok) {
      const d = await r.json();
      setRows(d.comments || []);
      if (d.articles) setArticles(d.articles);
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

      <div className="flex gap-2 mb-6 items-center">
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
        <button
          onClick={() => setAddOpen(true)}
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "12px",
            padding: "6px 14px",
            borderRadius: "18px",
            border: "1px solid var(--color-accent)",
            color: "var(--color-accent)",
            background: "transparent",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          + Post as someone
        </button>
      </div>

      {addOpen && (
        <AddCommentForm
          articles={articles}
          onClose={() => setAddOpen(false)}
          onDone={async () => {
            setAddOpen(false);
            setFilter("approved");
            await load();
          }}
        />
      )}

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

function AddCommentForm({
  articles,
  onClose,
  onDone,
}: {
  articles: ArticleOption[];
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [slug, setSlug] = useState("");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = articles.find((a) => a.slug === slug);
  const filtered = query.trim()
    ? articles.filter((a) => {
        const q = query.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  async function submit() {
    setErr("");
    if (!slug.trim()) return setErr("Article slug is required.");
    if (!name.trim()) return setErr("Name is required.");
    if (!body.trim()) return setErr("Comment body is required.");
    setBusy(true);
    const res = await fetch("/api/admin/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        article_slug: slug.trim(),
        name: name.trim(),
        email: email.trim() || null,
        body: body.trim(),
        created_at: createdAt.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed to post.");
      return;
    }
    setSlug("");
    setName("");
    setEmail("");
    setBody("");
    setCreatedAt("");
    await onDone();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--color-tag-border)",
    background: "var(--color-bg, #fff)",
    fontFamily: "var(--font-reading), serif",
    fontSize: "14px",
    color: "var(--color-ink)",
    outline: "none",
    boxSizing: "border-box",
    borderRadius: "4px",
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-accent)",
        borderRadius: "6px",
        padding: "20px",
        marginBottom: "24px",
        background: "var(--color-surface, rgba(0,0,0,0.02))",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Post as someone (migration)
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--color-meta)",
          }}
        >
          Cancel
        </button>
      </div>
      <p
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "13px",
          color: "var(--color-meta)",
          margin: "0 0 14px",
          lineHeight: 1.6,
        }}
      >
        Inserts a pre-approved comment under a chosen name. Leave date blank for &ldquo;now&rdquo;; set it to preserve the original
        timestamp from the old site.
      </p>
      <div style={{ display: "grid", gap: "10px" }}>
        <div style={{ position: "relative" }}>
          {selected ? (
            <div
              style={{
                ...inputStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selected.title}
                </div>
                <div style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "11px", color: "var(--color-meta)", letterSpacing: "0.04em" }}>
                  /{selected.slug}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSlug(""); setQuery(""); }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-meta)",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search articles by title… (${articles.length} available)`}
                style={inputStyle}
              />
              {filtered.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "var(--color-bg, #fff)",
                    border: "1px solid var(--color-tag-border)",
                    borderRadius: "4px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 10,
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  {filtered.map((a) => (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => { setSlug(a.slug); setQuery(""); }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--color-divider-soft)",
                        cursor: "pointer",
                        fontFamily: "var(--font-reading), serif",
                        fontSize: "14px",
                        color: "var(--color-ink)",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "11px", color: "var(--color-meta)", marginTop: "2px" }}>
                        /{a.slug} · {a.date?.slice(0, 10)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (displayed on the comment)" style={inputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional, not shown)" style={inputStyle} />
        </div>
        <input
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
          placeholder="Created at — ISO date (e.g. 2019-03-14T10:00:00Z). Leave blank for now."
          style={inputStyle}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Comment body…"
          rows={5}
          style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical", fontFamily: "var(--font-reading), serif" }}
        />
        {err && (
          <div style={{ fontFamily: "var(--font-reading), serif", fontSize: "13px", color: "var(--color-accent)" }}>{err}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              padding: "8px 18px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              borderRadius: "4px",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Posting…" : "Post comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
