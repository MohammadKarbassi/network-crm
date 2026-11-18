import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every CRM page depends on the signed-in user, so we use plain dynamic rendering
  // instead of Cache Components (which would need Suspense around every session read).
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
