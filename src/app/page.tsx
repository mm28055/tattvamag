// Homepage: featured + secondary grid + more reading + epigraph + notebook preview.
import type { Metadata } from "next";
import { getFrontendArticles } from "@/lib/frontend-data";
import { getAllNotebookEntriesAsync } from "@/lib/notebook-data";
import { SITE, EPIGRAPH } from "@/lib/site-config";
import {
  FeaturedEssay,
  SecondaryGrid,
  MoreReadingSection,
  QuoteSeparator,
  NotebookSection,
} from "@/components/home-sections";
import { ShowMoreLink } from "@/components/common";
import type { FrontendArticle } from "@/lib/frontend-types";

export const revalidate = 300;

export const metadata: Metadata = {
  // Use the root-layout default title ("Tattva — Dharma Text Inheritance") rather
  // than prefixing it; the homepage is the canonical landing page for the brand.
  title: { absolute: "Tattva — Dharma Text Inheritance" },
  description:
    "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Tattva — Dharma Text Inheritance",
    description:
      "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
    url: "/",
    siteName: "Tattva",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tattva — On dharma, text, and inheritance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tattva — Dharma Text Inheritance",
    description:
      "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
    images: ["/og-image.jpg"],
  },
};

// Place articles into homepage slots 1..N. Pinned articles (displayOrder set)
// go into their exact slot; remaining slots are filled from unpinned articles
// in the order supplied (date-DESC from the DB).
function arrangeSlots(articles: FrontendArticle[], slotCount: number): (FrontendArticle | undefined)[] {
  const slots: (FrontendArticle | undefined)[] = new Array(slotCount);
  const leftover: FrontendArticle[] = [];
  for (const a of articles) {
    const s = a.displayOrder;
    if (s && s >= 1 && s <= slotCount && !slots[s - 1]) {
      slots[s - 1] = a;
    } else {
      leftover.push(a);
    }
  }
  let i = 0;
  for (let idx = 0; idx < slotCount; idx++) {
    if (!slots[idx]) slots[idx] = leftover[i++];
  }
  return slots;
}

export default async function HomePage() {
  const all = await getFrontendArticles();
  const notebook = await getAllNotebookEntriesAsync();

  const [featured, s1, s2, s3, a1, a2, b] = arrangeSlots(all, 7);
  if (!featured) {
    return (
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 40px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "18px", color: "#6b6259" }}>
          No essays yet.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px" }}>
      <FeaturedEssay essay={featured} accent={SITE.accent} tagMuted={SITE.tagMuted} layout={SITE.featuredLayout} />
      {s1 && s2 && s3 && (
        <SecondaryGrid essays={[s1, s2, s3]} accent={SITE.accent} tagMuted={SITE.tagMuted} />
      )}
      {a1 && a2 && b && (
        <MoreReadingSection articles={[a1, a2, b]} accent={SITE.accent} tagMuted={SITE.tagMuted} />
      )}
      <ShowMoreLink label="Browse all essays" accent={SITE.accent} href="/archive?tab=essays" />
      <QuoteSeparator quote={EPIGRAPH} accent={SITE.accent} />
      <NotebookSection entries={notebook} accent={SITE.accent} tagMuted={SITE.tagMuted} />
      <ShowMoreLink label="All notebook entries" accent={SITE.accent} href="/notebook" />
    </main>
  );
}
