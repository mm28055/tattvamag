import type { Metadata } from "next";
import { Suspense } from "react";
import { getFrontendArticles } from "@/lib/frontend-data";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";
import { SITE } from "@/lib/site-config";
import ArchiveView from "@/components/archive-view";

export const metadata: Metadata = {
  title: "Archive",
  description: "All essays and notebook entries published on Tattva.",
};

export default async function ArchivePage() {
  const articles = await getFrontendArticles();
  const notebook = await getAllNotebookEntriesAsync();

  return (
    <Suspense fallback={null}>
      <ArchiveView articles={articles} notebookEntries={notebook} accent={SITE.accent} tagMuted={SITE.tagMuted} />
    </Suspense>
  );
}
