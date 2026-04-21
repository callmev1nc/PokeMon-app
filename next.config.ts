import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
      },
      {
        protocol: "https",
        hostname: "images.scrydex.com",
      },
    ],
  },
};

export default nextConfig;
