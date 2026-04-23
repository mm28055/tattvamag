import type { NextConfig } from "next";

// Legacy URLs from tattvamag.org (WordPress) that have no direct equivalent on
// tattva.in. Listed without trailing slashes; Next normalises /foo/ to /foo
// before redirects are evaluated, so one entry covers both.
//
//   /archives        → /archive           (plural → singular)
//   /history, /yoga-meditation, /art-culture, /religion-philosophy
//                    → /archive           (old WP category landing pages)
//   /home-2, /search-form, /more-articles → /
//                                         (dead WP utility pages)
const LEGACY_REDIRECTS = [
  { source: "/archives", destination: "/archive" },
  { source: "/history", destination: "/archive" },
  { source: "/yoga-meditation", destination: "/archive" },
  { source: "/art-culture", destination: "/archive" },
  { source: "/religion-philosophy", destination: "/archive" },
  { source: "/home-2", destination: "/" },
  { source: "/search-form", destination: "/" },
  { source: "/more-articles", destination: "/" },
] as const;

const nextConfig: NextConfig = {
  images: {
    // Any inline HTML body images still point at the old domain — allow them
    // until R2 migration. Also allow tattva.in in case any authored content
    // references images on the new canonical domain.
    remotePatterns: [
      { protocol: "https", hostname: "tattvamag.org" },
      { protocol: "https", hostname: "tattva.in" },
    ],
  },
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
