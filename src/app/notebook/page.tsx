import type { Metadata } from "next";
import { getAllNotebookEntries } from "@/lib/notebook-data";
import { SITE } from "@/lib/site-config";
import NotebookView from "@/components/notebook-view";

export const metadata: Metadata = {
  title: "Notebook",
  description: "Fragments, marginalia, and works in progress from the Tattva notebook.",
};

export default function NotebookPage() {
  const entries = getAllNotebookEntries();
  return <NotebookView entries={entries} accent={SITE.accent} tagMuted={SITE.tagMuted} />;
}
