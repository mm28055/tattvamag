import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllArticles,
  getAllTags,
  getAllCategories,
  formatDate,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Archive",
  description: "All essays and notes published on Tattva.",
};

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; tag?: string }>;
}) {
  const { cat, tag } = await searchParams;

  const all = await getAllArticles();
  let filtered = all;
  if (cat) filtered = filtered.filter((a) => a.category.slug === cat);
  if (tag) filtered = filtered.filter((a) => a.tags.some((t) => t.slug === tag));

  const categories = await getAllCategories();
  const tags = await getAllTags();

  const activeCategory = categories.find((c) => c.category.slug === cat)?.category;
  const activeTag = tags.find((t) => t.slug === tag);

  return (
    <div className="max-w-[860px] mx-auto px-6 md:px-10 pt-14 pb-24">
      <header className="mb-10 text-center">
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "48px",
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Archive
        </h1>
        <p
          style={{
            fontFamily: "var(--font-reading), serif",
            fontSize: "16px",
            color: "var(--color-meta)",
            marginTop: "12px",
            fontStyle: "italic",
          }}
        >
          {all.length} {all.length === 1 ? "essay" : "essays"} so far
          {activeCategory ? ` · filtered by category: ${activeCategory.name}` : ""}
          {activeTag ? ` · filtered by tag: ${activeTag.name}` : ""}
        </p>
      </header>

      {/* Category filters */}
      <div className="mb-6">
        <SectionLabel>Categories</SectionLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          <FilterPill
            label={`All (${all.length})`}
            href="/archive"
            active={!cat && !tag}
          />
          {categories.map((c) => (
            <FilterPill
              key={c.category.slug}
              label={`${c.category.name} (${c.count})`}
              href={`/archive?cat=${c.category.slug}`}
              active={c.category.slug === cat}
            />
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div className="mb-10">
        <SectionLabel>Tags</SectionLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t) => (
            <FilterPill
              key={t.slug}
              label={t.name}
              href={`/archive?tag=${t.slug}`}
              active={t.slug === tag}
              small
            />
          ))}
        </div>
      </div>

      {/* Article list */}
      <div>
        {filtered.map((a) => (
          <Link
            key={a.slug}
            href={`/${a.slug}`}
            className="block py-6 group"
            style={{ borderTop: "1px solid var(--color-divider-soft)" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    fontWeight: 500,
                    marginBottom: "6px",
                  }}
                >
                  {a.category.name}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontSize: "22px",
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: "var(--color-ink)",
                    margin: 0,
                  }}
                  className="group-hover:text-[var(--color-accent)] transition-colors"
                >
                  {a.title}
                </h3>
                {a.subtitle && (
                  <p
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontSize: "15px",
                      fontStyle: "italic",
                      color: "var(--color-meta)",
                      marginTop: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {a.subtitle}
                  </p>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "11px",
                    color: "var(--color-meta-faded)",
                    marginTop: "10px",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <span>{formatDate(a.date)}</span>
                  <span style={{ color: "var(--color-divider)" }}>·</span>
                  <span>{a.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p
            style={{
              fontFamily: "var(--font-reading), serif",
              fontSize: "16px",
              color: "var(--color-meta)",
              textAlign: "center",
              padding: "60px 0",
              fontStyle: "italic",
            }}
          >
            No essays match this filter yet.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: "11px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--color-meta)",
        fontWeight: 500,
      }}
    >
      {children}
    </h4>
  );
}

function FilterPill({
  label,
  href,
  active,
  small = false,
}: {
  label: string;
  href: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: small ? "11px" : "12px",
        padding: small ? "3px 10px" : "4px 14px",
        borderRadius: "20px",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-tag-border)"}`,
        color: active ? "var(--color-accent)" : "var(--color-meta)",
        background: active ? "rgba(184,58,20,0.05)" : "transparent",
        letterSpacing: "0.03em",
        fontWeight: active ? 500 : 400,
      }}
      className="transition-colors hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]"
    >
      {label}
    </Link>
  );
}
