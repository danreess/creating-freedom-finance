import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — no one can embed this in an iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers guessing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak the URL in the Referer header when leaving the site
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features this app doesn't need
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Force HTTPS for 2 years once deployed (ignored on localhost)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content Security Policy — restrict where scripts/styles/data can come from
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs unsafe-inline and unsafe-eval for its runtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Images can be data URIs (charts) or same-origin
      "img-src 'self' data: https:",
      // API calls only go to our own server (all third-party calls are server-side)
      "connect-src 'self'",
      "font-src 'self'",
      // No iframes
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
