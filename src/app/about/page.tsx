import type { Metadata } from "next";
import { getAbout } from "@/lib/about";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: "About Tattva — the intellectual notebook of Manish Maheshwari.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Tattva",
    description: "About Tattva — the intellectual notebook of Manish Maheshwari.",
    url: "/about",
    type: "website",
    siteName: "Tattva",
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Tattva",
    description: "About Tattva — the intellectual notebook of Manish Maheshwari.",
  },
};

export const revalidate = 300;

export default async function AboutPage() {
  const about = await getAbout();
  const accent = SITE.accent;
  const tagMuted = SITE.tagMuted;
  // The template prefixes a styled "Tattva" — strip a leading "Tattva " from the stored
  // intro so authors can write natural sentences either way.
  const introBody = about.intro.replace(/^\s*Tattva\s*/, "");

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "72px 40px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: "44px" }}>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "10.5px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: tagMuted,
            fontWeight: 600,
            marginBottom: "14px",
          }}
        >
          About
        </div>
        <div style={{ width: "40px", height: "2px", background: accent, margin: "0 auto" }} />
      </div>

      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "19px", lineHeight: 1.85, color: "#3a3530", margin: 0, whiteSpace: "pre-wrap" }}>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          Tattva
        </span>{" "}
        {introBody}
      </p>

      <p
        style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: "19px",
          lineHeight: 1.85,
          color: "#3a3530",
          marginTop: "28px",
          whiteSpace: "pre-wrap",
        }}
      >
        {about.bio}
      </p>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "15px",
          lineHeight: 1.8,
          color: "#9e958a",
          marginTop: "48px",
          fontStyle: "italic",
          borderTop: "1px solid #e2ddd5",
          paddingTop: "24px",
          textAlign: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {about.closing}
      </p>
    </main>
  );
}
