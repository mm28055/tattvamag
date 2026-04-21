import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFrontendArticles, getFrontendArticleBySlug } from "@/lib/frontend-data";
import { getAuthorBio } from "@/lib/author-bio";
import { SITE } from "@/lib/site-config";
import ArticleView from "@/components/article-view";

export async function generateStaticParams() {
  const all = await getFrontendArticles();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getFrontendArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.body.slice(0, 200),
    openGraph: {
      title: article.title,
      description: article.body.slice(0, 200),
      images: article.image?.src ? [{ url: article.image.src }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getFrontendArticleBySlug(slug);
  if (!article) return notFound();
  const all = await getFrontendArticles();
  const authorBio = await getAuthorBio();

  return (
    <ArticleView
      startArticle={article}
      allArticles={all}
      accent={SITE.accent}
      tagMuted={SITE.tagMuted}
      measure={SITE.measure}
      bodyFontSize={SITE.bodyFontSize}
      authorBio={authorBio}
    />
  );
}
