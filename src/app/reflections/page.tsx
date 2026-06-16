import type { Metadata } from "next";
import { getFrontendArticles } from "@/lib/frontend-data";
import { SITE } from "@/lib/site-config";
import ReflectionsView from "@/components/reflections-view";

// ISR so newly published reflections appear without a fresh deploy.
export const revalidate = 300;

const DESCRIPTION = "Personal essays — opinions and arguments on culture, tradition, and heritage.";

export const metadata: Metadata = {
  title: "Reflections",
  description: DESCRIPTION,
  alternates: { canonical: "/reflections" },
  openGraph: {
    title: "Reflections | Tattva",
    description: DESCRIPTION,
    url: "/reflections",
    type: "website",
    siteName: "Tattva",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tattva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reflections | Tattva",
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export default async function ReflectionsPage() {
  const all = await getFrontendArticles();
  const reflections = all.filter((a) => a.kind === "reflection");
  return <ReflectionsView reflections={reflections} accent={SITE.accent} tagMuted={SITE.tagMuted} />;
}
