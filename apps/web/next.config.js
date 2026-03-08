/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@zipath/ui"],
};

module.exports = nextConfig;
