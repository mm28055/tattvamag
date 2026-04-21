import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFrontendArticles, getFrontendArticleBySlug } from "@/lib/frontend-data";
import { SITE } from "@/lib/site-config";
import ArticleView from "@/components/article-view";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tattvamag.org").replace(/\/$/, "");

export async function generateStaticParams() {
  const all = await getFrontendArticles();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getFrontendArticleBySlug(slug);
  if (!article) return {};
  const description = article.subtitle || article.body.slice(0, 200);
  const url = `/${slug}`;
  const imageUrl = article.image?.src || undefined;
  return {
    title: article.title,
    description,
    authors: [{ name: article.author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url,
      siteName: "Tattva",
      locale: "en_US",
      publishedTime: article.datePublished,
      authors: [article.author],
      tags: article.tags,
      images: imageUrl ? [{ url: imageUrl, alt: article.image?.label || article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getFrontendArticleBySlug(slug);
  if (!article) return notFound();
  const all = await getFrontendArticles();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.subtitle || article.body.slice(0, 200),
    image: article.image?.src ? [article.image.src] : undefined,
    datePublished: article.datePublished,
    dateModified: article.datePublished,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Tattva",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${slug}`,
    },
    keywords: article.tags.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ArticleView
        startArticle={article}
        allArticles={all}
        accent={SITE.accent}
        tagMuted={SITE.tagMuted}
        measure={SITE.measure}
        bodyFontSize={SITE.bodyFontSize}
      />
    </>
  );
}
