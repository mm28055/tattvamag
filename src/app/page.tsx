// Homepage: featured + secondary grid + more reading + epigraph + notebook preview.
import { getFrontendArticles } from "@/lib/frontend-data";
import { getAllNotebookEntries } from "@/lib/notebook-data";
import { SITE, EPIGRAPH } from "@/lib/site-config";
import {
  FeaturedEssay,
  SecondaryGrid,
  MoreReadingSection,
  QuoteSeparator,
  NotebookSection,
} from "@/components/home-sections";
import { ShowMoreLink } from "@/components/common";

export const revalidate = 300;

export default async function HomePage() {
  const all = await getFrontendArticles();
  const notebook = getAllNotebookEntries();

  const [featured, s1, s2, s3, a1, a2, b] = all;
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
