// Homepage — toggles between Layout A (Variant 1 text-focused) and Layout B (v2) by day-of-year.
// You can force either layout for preview with ?layout=a or ?layout=b.

import { getAllArticles } from "@/lib/content";
import HomeLayoutA from "@/components/HomeLayoutA";
import HomeLayoutB from "@/components/HomeLayoutB";

export const revalidate = 3600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string }>;
}) {
  const { layout } = await searchParams;

  const all = await getAllArticles();
  const essays = all.filter((a) => a.type !== "note");
  const notes = all.filter((a) => a.type === "note");

  const featured = essays[0];
  const secondary = essays.slice(1);

  // Explicit override takes precedence; otherwise flip daily.
  let useLayoutA: boolean;
  if (layout === "a") useLayoutA = true;
  else if (layout === "b") useLayoutA = false;
  else {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    useLayoutA = dayOfYear % 2 === 0;
  }

  return useLayoutA ? (
    <HomeLayoutA featured={featured} secondary={secondary} />
  ) : (
    <HomeLayoutB featured={featured} secondary={secondary} notebook={notes.slice(0, 4)} />
  );
}
