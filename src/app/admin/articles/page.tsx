// Admin article manager — list every article with edit/delete affordances.
import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "32px",
            fontWeight: 500,
            color: "#1a1714",
            margin: 0,
          }}
        >
          Articles
        </h1>
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
          <Link
            href="/admin/new"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#B83A14",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            + New article
          </Link>
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
      </div>

      <p
        style={{
          fontFamily: "'Source Serif 4', serif",
          fontSize: "14px",
          color: "#6b6259",
          marginBottom: "32px",
          lineHeight: 1.6,
        }}
      >
        {articles.length} {articles.length === 1 ? "article" : "articles"} in the database. Click a row to edit. The <strong>Slot</strong> column shows which homepage position the article is pinned to (1 = featured, 2–4 = grid, 5–7 = more reading). Unpinned rows fall back to newest-first.
      </p>

      <div
        style={{
          border: "1px solid #e8e2d6",
          borderRadius: "2px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px minmax(0, 1fr) 100px 60px",
            padding: "12px 18px",
            borderBottom: "1px solid #e8e2d6",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "10.5px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8b7f72",
            fontWeight: 600,
            gap: "12px",
          }}
        >
          <span>Slot</span>
          <span>Title</span>
          <span>Date</span>
          <span style={{ textAlign: "right" }}>Type</span>
        </div>

        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/admin/articles/${a.slug}`}
            style={{
              display: "grid",
              gridTemplateColumns: "70px minmax(0, 1fr) 100px 60px",
              padding: "14px 18px",
              borderBottom: "1px solid #f0eadd",
              textDecoration: "none",
              color: "inherit",
              gap: "12px",
              alignItems: "baseline",
            }}
            className="hover:bg-[#faf5e8]"
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                color: a.displayOrder ? "#B83A14" : "#c4b9a8",
                fontWeight: a.displayOrder ? 600 : 400,
                letterSpacing: "0.04em",
              }}
            >
              {a.displayOrder ? `#${a.displayOrder}` : "—"}
            </span>
            <span
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: "15px",
                color: "#1a1714",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {a.title}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                color: "#8b7f72",
              }}
            >
              {a.date ? formatDate(a.date) : "—"}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "10.5px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: a.type === "note" ? "#B83A14" : "#8b7f72",
                textAlign: "right",
              }}
            >
              {a.type}
            </span>
          </Link>
        ))}

        {articles.length === 0 && (
          <div
            style={{
              padding: "40px 18px",
              textAlign: "center",
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: "#6b6259",
            }}
          >
            No articles yet. <Link href="/admin/new" style={{ color: "#B83A14" }}>Publish the first one →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
