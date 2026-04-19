// Design tokens derived from tattvamag-v2.jsx + tattvamag-four-variants.jsx (Variant 1).
// Keep this file the single source of truth. Tailwind utilities mirror it via globals.css.

export const tokens = {
  colors: {
    background: "#FAF8F4", // warm off-white (v2 bg)
    ink: "#1a1714",        // dark warm (logo/headings)
    bodyMuted: "#3a3530",  // body paragraph ink
    bodyFaded: "#5a554e",  // secondary body ink
    meta: "#7a7168",       // meta labels
    metaFaded: "#9e958a",  // inactive nav / least prominent meta
    divider: "#d8d2c8",
    dividerSoft: "#e2ddd5",
    tagBorder: "#d4cdc2",
    topBar: "#2B2520",
    topBarText: "#C4B9A8",
    accent: "#B83A14",     // cinnabar
  },
  fonts: {
    display: "var(--font-display)",   // Cormorant Garamond — titles, logo
    reading: "var(--font-reading)",   // Source Serif 4 — body
    sans: "var(--font-sans)",         // DM Sans — meta
  },
  layout: {
    maxReading: "720px",
    maxPage: "1140px",
  },
} as const;

// Category metadata — the 4 categories from the WordPress DB.
// Nav is now Current / Archive / About (user decision); these are filters on the archive page.
export const CATEGORIES: Record<string, { name: string; slug: string }> = {
  history: { name: "History", slug: "history" },
  "yoga-meditation": { name: "Yoga & Meditation", slug: "yoga-meditation" },
  "art-culture": { name: "Art & Culture", slug: "art-culture" },
  "religion-philosophy": { name: "Religion & Philosophy", slug: "religion-philosophy" },
};
