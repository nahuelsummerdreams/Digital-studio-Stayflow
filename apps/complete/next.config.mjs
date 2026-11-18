/** Basic browser hardening. The app is never shown inside another site, never needs camera/microphone/location from the browser
 * (the cleaning team's photo button uses the phone's own picker), and a guest's link must not leak to other sites. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Private links (guest guide, the team's page): never send them along as a referrer.
      { source: "/g/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/t/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
  transpilePackages: [
    "@stayflow/shell",
    "@stayflow/i18n",
    "@stayflow/auth",
    "@stayflow/licensing",
    "@stayflow/module-host",
    "@stayflow/module-guest",
    "@stayflow/module-operations",
    "@stayflow/module-profit",
    "@stayflow/money",
    "@stayflow/ui",
  ],
};
