import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Any inline HTML body images still point at the old domain — allow them until R2 migration.
    remotePatterns: [
      { protocol: "https", hostname: "tattvamag.org" },
    ],
  },
};

export default nextConfig;
