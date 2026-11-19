import type { NextConfig } from "next";

// Report-only first: violations show in the browser console, nothing is blocked. Enforce after a clean soak on production.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://lh3.googleusercontent.com",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.livekit.cloud wss://*.livekit.cloud",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

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
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
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
