import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run deploy copies .next/standalone rather than node_modules -
  // see Dockerfile.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
