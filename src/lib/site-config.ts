// Site-wide config — colors, layout knobs, epigraph.
// Matches SITE_CONFIG in the original prototype's App.jsx.

export const SITE = {
  accent: "#B83A14",
  tagMuted: "#C8735A",
  background: "#F4E8D4",
  featuredLayout: "split" as "split" | "centered",
  headerVariant: "classical" as "classical" | "editorial",
  measure: 720,
  bodyFontSize: 18,
};

export const EPIGRAPH = {
  lines: [
    "Do not neglect the truth. Do not neglect the Dharma.",
    "Do not neglect your health. Do not neglect your wealth.",
    "Do not neglect your private and public recitation of the Veda.",
    "Do not neglect the rites to gods and ancestors.",
    "",
    "Treat your mother like a god. Treat your father like a god.",
    "Treat your teacher like a god. Treat your guests like gods.",
  ],
  attribution: "Taittirīya Upaniṣad · Śikṣāvallī",
};
