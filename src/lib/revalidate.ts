// On-demand ISR: purge every public route that could have been affected by
// an admin mutation. Called from POST/PUT/DELETE handlers so Vercel's edge
// cache reflects the change immediately instead of waiting for the next
// scheduled revalidation (or a fresh deploy).
import "server-only";
import { revalidatePath } from "next/cache";

export function revalidatePublicContent(opts: {
  articleSlug?: string; // optional — when a specific article was touched
  notebook?: boolean;   // true when a notebook entry was touched
  about?: boolean;      // true when the /about page was touched
} = {}) {
  // Always-affected pages: home (featured + ordering), archive (full list),
  // sitemap, and RSS. Cheap to rebuild.
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");

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
