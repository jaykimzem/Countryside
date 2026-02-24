import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow static HTML assets in /public to coexist with Next.js pages
  // /index.html serves the Countryside static site
  // /tour serves the 3D virtual tour
  // No rewrites needed as src/app/page.tsx handles the root redirect
  // and static files in /public are served automatically by Next.js
};

export default nextConfig;