import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Dev only: lets a second browser session use http://127.0.0.1:3000 (separate cookies from localhost).
  allowedDevOrigins: ["127.0.0.1"],
  partialPrefetching: true,
  // Every app route reads the signed-in session (request-time data), so it can't be part of the static shell.
  // Validate only segments that explicitly export `instant`, instead of warning on every page.
  experimental: { instantInsights: { validationLevel: "manual-warning" } },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
      ],
    }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
