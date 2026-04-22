import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tattva.in").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Tattva — Celebrating Dharma", template: "%s | Tattva" },
  description:
    "Tattva is the intellectual notebook of Manish Maheshwari — essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
  keywords: [
    "Indian philosophy",
    "dharma",
    "Shaiva studies",
    "Sanskrit",
    "Hindu philosophy",
    "Navya-Nyaya",
    "Indian textual traditions",
    "Tattva",
  ],
  authors: [{ name: "Manish Maheshwari" }],
  creator: "Manish Maheshwari",
  publisher: "Tattva Heritage Foundation",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Tattva",
    title: "Tattva — Celebrating Dharma",
    description:
      "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
    url: SITE_URL,
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
    title: "Tattva — Celebrating Dharma",
    description:
      "Essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Organization + WebSite schemas help Google understand the publication itself
// (independent of any single article). Emitted once in the root layout so every
// page carries it.
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tattva",
  alternateName: "Tattva Heritage Foundation",
  url: SITE_URL,
  founder: { "@type": "Person", name: "Manish Maheshwari" },
  sameAs: [
    "https://www.tattvaheritage.org",
    "https://www.shaivastudies.in",
  ],
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tattva",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/archive?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Noto+Serif+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Tattva — Celebrating Dharma"
          href="/rss.xml"
        />
        {/* Font Awesome — used for the social share icons at the end of articles */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
