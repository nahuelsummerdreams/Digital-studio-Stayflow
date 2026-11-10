/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  transpilePackages: [
    "@stayflow/shell",
    "@stayflow/i18n",
    "@stayflow/auth",
    "@stayflow/licensing",
    "@stayflow/module-guest",
    "@stayflow/ui",
  ],
};
