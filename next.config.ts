import type { NextConfig } from "next";

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
};

export default nextConfig;
