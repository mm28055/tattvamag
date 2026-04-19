// Admin login. Simple password form.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invalid password");
    }
  }

  return (
    <div className="max-w-[380px] mx-auto px-6 pt-20 pb-24">
      <h1
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "32px",
          fontWeight: 700,
          color: "var(--color-ink)",
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        Admin
      </h1>
      <p
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "14px",
          color: "var(--color-meta)",
          textAlign: "center",
          marginBottom: "32px",
          fontStyle: "italic",
        }}
      >
        Only the editor can sign in here.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          required
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "14px",
            padding: "10px 14px",
            border: "1px solid var(--color-tag-border)",
            background: "var(--color-bg)",
            color: "var(--color-ink)",
            borderRadius: "2px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "12px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "10px 16px",
            background: "var(--color-ink)",
            color: "#FAF8F4",
            border: "none",
            borderRadius: "2px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {error && (
          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--color-accent)",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
