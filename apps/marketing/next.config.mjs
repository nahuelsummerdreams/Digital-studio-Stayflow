const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  ...(process.env.NO_DEV_BADGE ? { devIndicators: false } : {}),
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  transpilePackages: ["@stayflow/module-marketing", "@stayflow/ui"],
};
