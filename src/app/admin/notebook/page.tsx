// Admin notebook manager — list all entries with edit/delete affordances.
import Link from "next/link";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";

export const dynamic = "force-dynamic";

export default async function AdminNotebookPage() {
  const entries = await getAllNotebookEntriesAsync();

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "48px 32px 80px" }}>
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
          Notebook entries
        </h1>
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
          <Link
            href="/admin/notebook/new"
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
            + Add entry
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
        {entries.length} {entries.length === 1 ? "entry" : "entries"}. Notebook entries are short journal posts — no cover image, no footnotes, no .docx required. Type and go.
      </p>

      <div style={{ border: "1px solid #e8e2d6", borderRadius: "2px", background: "#fff" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 180px 120px",
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
          <span>Title</span>
          <span>Tags</span>
          <span>Date</span>
        </div>

        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/admin/notebook/${e.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 180px 120px",
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
                fontFamily: "'Source Serif 4', serif",
                fontSize: "15px",
                color: "#1a1714",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {e.title}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#6b6259" }}>
              {(e.tags || []).join(", ")}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#8b7f72" }}>
              {e.datePublished}
            </span>
          </Link>
        ))}

        {entries.length === 0 && (
          <div
            style={{
              padding: "40px 18px",
              textAlign: "center",
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: "#6b6259",
            }}
          >
            No notebook entries yet. <Link href="/admin/notebook/new" style={{ color: "#B83A14" }}>Write the first →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
