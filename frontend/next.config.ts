import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Use basePath for branch deployments (e.g. /branch-name)
  // Ensure it starts with a slash if present
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
