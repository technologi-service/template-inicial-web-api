import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrites so /api/* in dev points to the Elysia API
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
