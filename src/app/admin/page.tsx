import Link from "next/link";
import { sql, hasDb } from "@/lib/db";
import { getAllArticles } from "@/lib/content";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const articles = await getAllArticles();
  let pendingComments = 0;
  let approvedComments = 0;
  if (hasDb) {
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE is_approved = FALSE) AS pending,
        COUNT(*) FILTER (WHERE is_approved = TRUE)  AS approved
      FROM comments
    `) as { pending: string; approved: string }[];
    pendingComments = Number(rows[0]?.pending || 0);
    approvedComments = Number(rows[0]?.approved || 0);
  }

  return (
    <div className="max-w-[880px] mx-auto px-6 pt-12 pb-24">
      <header className="mb-10 flex items-baseline justify-between">
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "36px",
            fontWeight: 700,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Admin
        </h1>
        <LogoutButton />
      </header>

      {!hasDb && (
        <div
          style={{
            background: "rgba(184,58,20,0.08)",
            border: "1px solid var(--color-accent)",
            padding: "14px 18px",
            borderRadius: "3px",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "13px",
            color: "var(--color-body-muted)",
            marginBottom: "24px",
          }}
        >
          <strong>DATABASE_URL is not configured.</strong> Set it in <code>.env.local</code> to
          enable article upload and comment moderation. The public site continues to read from the
          local JSON cache.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat label="Articles" value={articles.length} href="/archive" />
        <Stat label="Pending comments" value={pendingComments} href="/admin/comments" accent={pendingComments > 0} />
        <Stat label="Approved comments" value={approvedComments} href="/admin/comments?filter=approved" />
      </div>

      <section className="mt-10">
        <h2
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--color-ink)",
            marginBottom: "18px",
          }}
        >
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard href="/admin/new" title="Publish a new article" description="Upload a .docx, add a cover image, and publish." />
          <ActionCard href="/admin/comments" title="Moderate comments" description="Approve or delete pending reader comments." />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, href, accent = false }: { label: string; value: number; href?: string; accent?: boolean }) {
  const inner = (
    <div
      style={{
        border: `1px solid ${accent ? "var(--color-accent)" : "var(--color-divider-soft)"}`,
        padding: "20px 24px",
        background: accent ? "rgba(184,58,20,0.05)" : "transparent",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-meta)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "38px",
          fontWeight: 700,
          color: accent ? "var(--color-accent)" : "var(--color-ink)",
          marginTop: "6px",
        }}
      >
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function ActionCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block group"
      style={{
        border: "1px solid var(--color-divider-soft)",
        padding: "18px 22px",
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "19px",
          fontWeight: 600,
          color: "var(--color-ink)",
          marginBottom: "4px",
        }}
        className="group-hover:text-[color:var(--color-accent)] transition-colors"
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "14px",
          color: "var(--color-meta)",
        }}
      >
        {description}
      </div>
    </Link>
  );
}

