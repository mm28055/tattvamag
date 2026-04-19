import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllArticles,
  getArticleBySlug,
  formatDate,
} from "@/lib/content";
import SocialRail from "@/components/SocialRail";
import Comments from "@/components/Comments";

export async function generateStaticParams() {
  const all = await getAllArticles();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.metaDescription.slice(0, 200),
    openGraph: {
      title: article.title,
      description: article.metaDescription.slice(0, 200),
      images: article.featuredImage.local
        ? [{ url: article.featuredImage.local }]
        : undefined,
    },
  };
}

/**
 * Inject Tufte-style margin footnotes.
 * For each <sup class="footnote-ref" data-ref="N">, we insert an <aside class="footnote-side">
 * immediately after it containing the footnote content. CSS floats it into the right margin.
 */
function injectMarginFootnotes(body: string, footnotes: { num: string; html: string }[]): string {
  const byNum = new Map(footnotes.map((f) => [f.num, f.html]));
  return body.replace(
    /<sup class="footnote-ref" data-ref="(\d+)">\d+<\/sup>/g,
    (match, num) => {
      const html = byNum.get(num);
      if (!html) return match;
      return `${match}<aside class="footnote-side" id="fn-side-${num}"><span class="fn-num">${num}</span> ${html}</aside>`;
    },
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return notFound();

  const hasFeatured = !!article.featuredImage?.local;
  const bodyWithMarginFootnotes = injectMarginFootnotes(article.body, article.footnotes);

  return (
    <>
      <SocialRail />

      <article className="max-w-[1100px] mx-auto px-6 md:px-10 pt-14 pb-24">
        {/* ══ HEADER ══ */}
        <header
          className={
            hasFeatured
              ? "grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-12 items-center mb-14"
              : "max-w-[760px] mx-auto text-center mb-14"
          }
        >
          <div className={hasFeatured ? "" : "mx-auto"}>
            <Link
              href={`/archive?cat=${article.category.slug}`}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                fontWeight: 500,
                display: "inline-block",
                marginBottom: "18px",
              }}
              className="hover:underline"
            >
              {article.category.name}
            </Link>

            <h1
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: hasFeatured ? "40px" : "46px",
                fontWeight: 700,
                color: "var(--color-ink)",
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              {article.title}
            </h1>

            {article.subtitle && (
              <p
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "19px",
                  fontStyle: "italic",
                  color: "var(--color-meta)",
                  lineHeight: 1.5,
                  margin: "18px 0 26px",
                  fontWeight: 400,
                }}
              >
                {article.subtitle}
              </p>
            )}

            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "13px",
                color: "var(--color-meta-faded)",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: hasFeatured ? "flex-start" : "center",
              }}
            >
              <span style={{ color: "var(--color-body-faded)", fontWeight: 500 }}>
                {article.author}
              </span>
              <span style={{ color: "var(--color-tag-border)" }}>|</span>
              <span>{article.readTime}</span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "12px",
                color: "var(--color-meta-faded)",
                marginTop: "8px",
                textAlign: hasFeatured ? "left" : "center",
              }}
            >
              {formatDate(article.date)}
            </div>
          </div>

          {hasFeatured && (
            <div>
              <div
                className="relative w-full aspect-[16/10] overflow-hidden"
                style={{ background: "var(--color-divider)" }}
              >
                <Image
                  src={article.featuredImage.local!}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              {article.illustrator && (
                <div
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "12px",
                    color: "var(--color-meta-faded)",
                    marginTop: "10px",
                    textAlign: "right",
                    fontStyle: "italic",
                  }}
                >
                  Illustrations by {article.illustrator}
                </div>
              )}
            </div>
          )}
        </header>

        <hr
          style={{
            border: 0,
            borderTop: "1px solid var(--color-divider-soft)",
            marginBottom: "48px",
            maxWidth: hasFeatured ? "100%" : "760px",
          }}
          className="mx-auto"
        />

        {/* ══ BODY — reading column + margin footnotes (float right via CSS) ══ */}
        <div className="max-w-[660px] mx-auto">
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: bodyWithMarginFootnotes }}
          />
        </div>

        {/* Bottom-of-article footnote list (visible on mobile/tablet only) */}
        {article.footnotes.length > 0 && (
          <div className="article-footnotes-bottom">
            <h2>Footnotes</h2>
            <ol>
              {article.footnotes.map((fn) => (
                <li key={fn.num} id={`fn-${fn.num}`}>
                  <span className="fn-num">{fn.num}</span>
                  <span dangerouslySetInnerHTML={{ __html: fn.html }} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ══ COMMENTS ══ */}
        <Comments slug={article.slug} />

        {/* ══ TAGS ══ */}
        {article.tags.length > 0 && (
          <div
            className="max-w-[660px] mx-auto mt-20 pt-6"
            style={{ borderTop: "1px solid var(--color-divider-soft)" }}
          >
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/archive?tag=${t.slug}`}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "11px",
                    color: "var(--color-meta)",
                    border: "1px solid var(--color-tag-border)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    letterSpacing: "0.03em",
                  }}
                  className="hover:text-[color:var(--color-accent)] hover:border-[color:var(--color-accent)] transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
