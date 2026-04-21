// Types for the front-end component tree — matches the shape in the original data.js prototype.
// Shared between the data adapter (server-side) and the view components (client-side).

export type BlockP = { type: "p"; text: string; indent?: number };
export type BlockH2 = { type: "h2"; text: string; indent?: number };
export type BlockPullquote = { type: "pullquote"; text: string };
export type BlockImage = { type: "image"; src?: string; label?: string; caption?: string; aspectRatio?: string };
export type BlockQuote = { type: "quote"; text: string };
export type Block = BlockP | BlockH2 | BlockPullquote | BlockImage | BlockQuote;

export type FrontendArticle = {
  id: string;            // slug for URLs
  slug: string;          // same as id; kept explicit for clarity
  title: string;
  subtitle: string;
  tags: string[];
  author: string;
  readTime: string;
  body: string;          // excerpt used on cards
  image: { src?: string; label?: string } | null;
  heroStyle?: "image" | "none";
  frontispiece?: { src?: string; label?: string; caption?: string; width?: string };
  datePublished?: string;
  illustrationCredit?: string;
  fullBody?: Block[];    // block list used on the article page
  displayOrder?: number | null; // homepage slot (1-based), or null/undefined if unpinned
};

export type FrontendNotebookEntry = {
  id: string;            // slug for URLs (e.g., "on-gadamers-prejudice")
  title: string;
  tags: string[];
  author: string;
  datePublished?: string;
  body: string | Block[];
  /** Pre-rendered HTML from markdown `body`. Present when body is a string. */
  bodyHtml?: string;
};

export type FrontendEpigraph = { lines: string[]; attribution: string };

export type Tag = string;
