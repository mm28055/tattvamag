// Notebook entries. For now, seeded from the design prototype; can later be moved into Neon
// alongside articles once the admin notebook-upload flow is built.
import "server-only";
import seed from "@/data/_notebook-seed.json";
import type { FrontendNotebookEntry } from "./frontend-types";

export function getAllNotebookEntries(): FrontendNotebookEntry[] {
  return seed as FrontendNotebookEntry[];
}

export function getNotebookEntryById(id: string): FrontendNotebookEntry | null {
  return getAllNotebookEntries().find((e) => e.id === id) ?? null;
}
