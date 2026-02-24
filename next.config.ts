import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow static HTML assets in /public to coexist with Next.js pages
  // /index.html serves the Countryside static site
  // /tour serves the 3D virtual tour
  async rewrites() {
    return [
      // Serve root homepage from static public/index.html
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },
};

export default nextConfig;