import type { Metadata } from "next";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";
import { SITE } from "@/lib/site-config";
import NotebookView from "@/components/notebook-view";

export const metadata: Metadata = {
  title: "Notebook",
  description: "Fragments, marginalia, and works in progress from the Tattva notebook.",
  alternates: { canonical: "/notebook" },
  openGraph: {
    title: "Notebook | Tattva",
    description: "Fragments, marginalia, and works in progress from the Tattva notebook.",
    url: "/notebook",
    type: "website",
    siteName: "Tattva",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notebook | Tattva",
    description: "Fragments, marginalia, and works in progress from the Tattva notebook.",
  },
};

export default async function NotebookPage() {
  const entries = await getAllNotebookEntriesAsync();
  return <NotebookView entries={entries} accent={SITE.accent} tagMuted={SITE.tagMuted} />;
}
