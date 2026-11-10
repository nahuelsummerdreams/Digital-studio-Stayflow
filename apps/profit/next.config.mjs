/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Workspace packages ship TypeScript sources.
  transpilePackages: ["@stayflow/auth", "@stayflow/licensing", "@stayflow/module-profit", "@stayflow/ui"],
};
