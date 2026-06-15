import type { Metadata } from "next";
import { Suspense } from "react";
import { getFrontendArticles } from "@/lib/frontend-data";
import { getAuthorBios } from "@/lib/author-bio";
import { SITE } from "@/lib/site-config";
import ArchiveView from "@/components/archive-view";

// ISR: regenerate periodically so newly published articles appear without a
// fresh deploy (matches the homepage). Without this the page is fully static
// and freezes at build time.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Archive",
  description: "All essays and reflections published on Tattva.",
  alternates: { canonical: "/archive" },
  openGraph: {
    title: "Archive | Tattva",
    description: "All essays and reflections published on Tattva.",
    url: "/archive",
    type: "website",
    siteName: "Tattva",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tattva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Archive | Tattva",
    description: "All essays and reflections published on Tattva.",
    images: ["/og-image.jpg"],
  },
};

export default async function ArchivePage() {
  const all = await getFrontendArticles();
  const essays = all.filter((a) => a.kind !== "reflection");
  const reflections = all.filter((a) => a.kind === "reflection");
  const authorBios = await getAuthorBios();

  return (
    <Suspense fallback={null}>
      <ArchiveView articles={essays} reflections={reflections} accent={SITE.accent} tagMuted={SITE.tagMuted} authorBios={authorBios} />
    </Suspense>
  );
}
