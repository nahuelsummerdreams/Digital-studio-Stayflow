/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
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
