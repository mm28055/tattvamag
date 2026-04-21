import type { Metadata } from "next";
import { Suspense } from "react";
import { getFrontendArticles } from "@/lib/frontend-data";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";
import { getAuthorBios } from "@/lib/author-bio";
import { SITE } from "@/lib/site-config";
import ArchiveView from "@/components/archive-view";

export const metadata: Metadata = {
  title: "Archive",
  description: "All essays and notebook entries published on Tattva.",
  alternates: { canonical: "/archive" },
  openGraph: {
    title: "Archive | Tattva",
    description: "All essays and notebook entries published on Tattva.",
    url: "/archive",
    type: "website",
    siteName: "Tattva",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tattva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Archive | Tattva",
    description: "All essays and notebook entries published on Tattva.",
    images: ["/og-image.jpg"],
  },
};

export default async function ArchivePage() {
  const articles = await getFrontendArticles();
  const notebook = await getAllNotebookEntriesAsync();
  const authorBios = await getAuthorBios();

  return (
    <Suspense fallback={null}>
      <ArchiveView articles={articles} notebookEntries={notebook} accent={SITE.accent} tagMuted={SITE.tagMuted} authorBios={authorBios} />
    </Suspense>
  );
}
