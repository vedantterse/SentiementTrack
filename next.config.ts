import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint checking during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
