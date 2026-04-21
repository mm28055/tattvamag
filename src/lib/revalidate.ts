// On-demand ISR: purge every public route that could have been affected by
// an admin mutation. Called from POST/PUT/DELETE handlers so Vercel's edge
// cache reflects the change immediately instead of waiting for the next
// scheduled revalidation (or a fresh deploy).
import "server-only";
import { revalidatePath } from "next/cache";
import { invalidateContentCache } from "./content";
import { invalidateFrontendCache } from "./frontend-data";

export function revalidatePublicContent(opts: {
  articleSlug?: string; // optional — when a specific article was touched
  notebook?: boolean;   // true when a notebook entry was touched
  about?: boolean;      // true when the /about page was touched
} = {}) {
  // Clear BOTH in-memory caches in this process. content.ts caches the raw
  // article rows; frontend-data.ts caches the cheerio-transformed blocks
  // derived from those rows. Invalidating only one leaves the reader page
  // serving stale data for up to 30s — which used to show up as "saved
  // changes don't appear until I save a second time."
  invalidateContentCache();
  invalidateFrontendCache();

  // Always-affected pages: home (featured + ordering), archive (full list),
  // sitemap, and RSS. Cheap to rebuild.
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");

  // Revalidate all article pages so their allArticles prop (used by the
  // infinite scroll chain) reflects the current article list. Without this,
  // deleted or newly-added articles keep appearing/missing in other articles'
  // scroll chains until those pages happen to be rerendered.
  revalidatePath("/[slug]", "page");

  if (opts.articleSlug) {
    revalidatePath(`/${opts.articleSlug}`);
  }
  if (opts.notebook) {
    revalidatePath("/notebook");
  }
  if (opts.about) {
    revalidatePath("/about");
  }
}
