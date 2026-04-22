"use client";
// "Correspondence" section — letter modal submits to /api/comments/[slug].
// Approved comments are fetched from the same endpoint.
import React, { useEffect, useState } from "react";

type ApiComment = { id: number; name: string; body: string; createdAt: string };

export default function CommentsClient({ slug, accent, measure = 780 }: { slug: string; accent: string; measure?: number }) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/comments/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slug]);

  const submit = async (payload: { name: string; body: string }) => {
    const res = await fetch(`/api/comments/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setModalOpen(false);
      setThanksOpen(true);
    }
    return res.ok;
  };

  return (
    <section
      style={{
        maxWidth: `${measure}px`,
        margin: "0 auto",
        padding: "40px 40px 0 72px",
        borderTop: "1px solid #d8d2c8",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 600,
            }}
          >
            Correspondence
          </span>
          <span style={{ color: "#b0a89e", fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", lineHeight: 1 }}>·</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontStyle: "italic", fontWeight: 500, color: "#1a1714" }}>
            Letters
          </span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            color: accent,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            borderBottom: `1px solid ${accent}`,
          }}
        >
          Write →
        </button>
      </div>

      {loaded && comments.length === 0 && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: "#8b7f72", marginTop: "28px" }}>
          No letters yet. Be the first to write.
        </p>
      )}

      {comments.length > 0 && (
        <div style={{ marginTop: "36px" }}>
          {comments.map((c, i) => {
            const initials = c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <article
                key={c.id}
                style={{
                  display: "flex",
                  gap: "20px",
                  padding: "24px 0",
                  borderBottom: i < comments.length - 1 ? "1px solid #e8e4dc" : "none",
                }}
              >
                <div
                  style={{
                    flex: "0 0 44px",
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${accent}`,
                    color: accent,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#3a3530" }}>{c.name}</span>
                  </div>
                  <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", lineHeight: 1.7, color: "#2a2520", margin: 0, whiteSpace: "pre-wrap" }}>
                    {c.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <LetterModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={submit} accent={accent} />
      <LetterConfirmation open={thanksOpen} onClose={() => setThanksOpen(false)} accent={accent} />
    </section>
  );
}

function LetterModal({
  open,
  onClose,
  onSubmit,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (p: { name: string; body: string }) => Promise<boolean>;
  accent: string;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [captcha, setCaptcha] = useState({ a: 2, b: 3, sum: 5 });
  const [captchaAns, setCaptchaAns] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setBody("");
      setCaptchaAns("");
      setErr("");
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      setCaptcha({ a, b, sum: a + b });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) return setErr("Please include your name.");
    if (body.trim().length < 20) return setErr("A letter should be at least a sentence or two.");
    if (parseInt(captchaAns, 10) !== captcha.sum) return setErr("The arithmetic didn't add up — please try again.");
    setSubmitting(true);
    const ok = await onSubmit({ name: name.trim(), body: body.trim() });
    setSubmitting(false);
    if (!ok) setErr("Could not submit. Try again in a moment.");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d8d2c8",
    background: "#fff",
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "15px",
    color: "#1a1714",
    outline: "none",
    boxSizing: "border-box",
    borderRadius: 0,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 23, 20, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "#FAF5E8",
          padding: "36px 40px 32px",
          position: "relative",
          borderTop: `3px solid ${accent}`,
          boxShadow: "0 30px 80px rgba(26, 23, 20, 0.25)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "14px",
            right: "16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "22px",
            color: "#9e958a",
            lineHeight: 1,
            padding: "4px 8px",
          }}
        >
          ×
        </button>

        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: accent, fontWeight: 600, marginBottom: "6px" }}>
          Correspondence
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontStyle: "italic", fontWeight: 500, color: "#1a1714", margin: 0 }}>
          Write a letter
        </h3>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14px", color: "#6b6259", marginTop: "8px", lineHeight: 1.6 }}>
          Letters will appear on the site after review.
        </p>

        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your letter…" rows={6} style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" }} />
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <label style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "14px", color: "#3a3530", flex: 1 }}>
              A small verification — what is{" "}
              <strong style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px" }}>
                {captcha.a} + {captcha.b}
              </strong>
              ?
            </label>
            <input value={captchaAns} onChange={(e) => setCaptchaAns(e.target.value)} inputMode="numeric" style={{ ...inputStyle, width: "80px", textAlign: "center" }} />
          </div>
          {err && (
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "14px", color: accent }}>{err}</div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "24px", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#6b6259",
              padding: "10px 4px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              padding: "12px 24px",
              background: accent,
              color: "#FAF5E8",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Sending…" : "Send letter →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LetterConfirmation({ open, onClose, accent }: { open: boolean; onClose: () => void; accent: string }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 23, 20, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          background: "#FAF5E8",
          padding: "48px 44px 40px",
          textAlign: "center",
          borderTop: `3px solid ${accent}`,
          boxShadow: "0 30px 80px rgba(26, 23, 20, 0.25)",
        }}
      >
        <div style={{ color: accent, fontFamily: "'Cormorant Garamond', serif", fontSize: "36px", marginBottom: "12px" }}>❦</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontStyle: "italic", fontWeight: 500, color: "#1a1714", margin: "0 0 14px" }}>
          Your letter has been received.
        </h3>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "15px", color: "#554a40", lineHeight: 1.65, margin: 0 }}>
          Once approved, it will appear here.
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: "28px",
            padding: "10px 22px",
            background: "transparent",
            color: accent,
            border: `1px solid ${accent}`,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
