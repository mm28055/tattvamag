import type { Metadata } from "next";
import { getFrontendArticles } from "@/lib/frontend-data";
import { SITE } from "@/lib/site-config";
import ArticleIndexView from "@/components/article-index-view";

// ISR so newly published essays appear without a fresh deploy.
export const revalidate = 300;

const DESCRIPTION = "Researched essays on Hindu philosophy, history, and textual traditions.";

export const metadata: Metadata = {
  title: "Essays",
  description: DESCRIPTION,
  alternates: { canonical: "/essays" },
  openGraph: {
    title: "Essays | Tattva",
    description: DESCRIPTION,
    url: "/essays",
    type: "website",
    siteName: "Tattva",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tattva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Essays | Tattva",
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export default async function EssaysPage() {
  const all = await getFrontendArticles();
  const essays = all.filter((a) => a.kind !== "reflection");
  return (
    <ArticleIndexView
      items={essays}
      accent={SITE.accent}
      tagMuted={SITE.tagMuted}
      kicker="Essays"
      title="Histories, texts, and close readings"
      subtitle={DESCRIPTION}
      emptyLabel="No essays yet."
    />
  );
}
