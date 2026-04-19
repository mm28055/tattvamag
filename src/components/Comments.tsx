"use client";
import { useState, useEffect } from "react";

type Comment = {
  id: number;
  name: string;
  body: string;
  createdAt: string;
  parentId: number | null;
};

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/comments/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`/api/comments/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, body, website }),
    });
    setSubmitting(false);
    if (res.ok) {
      setName("");
      setEmail("");
      setBody("");
      setMessage({ kind: "success", text: "Thank you — your comment is pending review." });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: data.error || "Could not submit comment." });
    }
  }

  const approved = comments;

  return (
    <section
      className="max-w-[660px] mx-auto mt-20 pt-10"
      style={{ borderTop: "1px solid var(--color-divider-soft)" }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--color-ink)",
          marginBottom: "20px",
        }}
      >
        Comments {approved.length > 0 && <span style={{ color: "var(--color-meta-faded)", fontWeight: 400 }}>({approved.length})</span>}
      </h2>

      {loaded && approved.length === 0 && (
        <p
          style={{
            fontFamily: "var(--font-reading), serif",
            fontSize: "15px",
            color: "var(--color-meta)",
            fontStyle: "italic",
            marginBottom: "28px",
          }}
        >
          No comments yet.
        </p>
      )}

      <ul className="mb-10">
        {approved.map((c) => (
          <li
            key={c.id}
            className="py-5"
            style={{ borderTop: "1px solid var(--color-divider-softer)" }}
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--color-ink)",
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: "var(--color-meta-faded)",
                  letterSpacing: "0.03em",
                }}
              >
                {new Date(c.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-reading), serif",
                fontSize: "15px",
                lineHeight: 1.75,
                color: "var(--color-body-muted)",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {c.body}
            </p>
          </li>
        ))}
      </ul>

      <h3
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "19px",
          fontWeight: 600,
          color: "var(--color-ink)",
          marginBottom: "12px",
        }}
      >
        Leave a comment
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
            maxLength={80}
            style={inputStyle}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (not published)"
            maxLength={200}
            style={inputStyle}
          />
        </div>
        {/* Honeypot — visually hidden */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Your comment…"
          required
          minLength={2}
          maxLength={4000}
          rows={5}
          style={{ ...inputStyle, fontFamily: "var(--font-reading), serif", fontSize: "15px", resize: "vertical" }}
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "10px 22px",
              background: "var(--color-ink)",
              color: "#FAF8F4",
              border: "none",
              borderRadius: "2px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {message && (
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "13px",
                color: message.kind === "success" ? "var(--color-body-faded)" : "var(--color-accent)",
                fontStyle: "italic",
              }}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
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
};
