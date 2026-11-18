import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every CRM page depends on the signed-in user, so we use plain dynamic rendering
  // instead of Cache Components (which would need Suspense around every session read).
  turbopack: { root: __dirname },
  // Types are checked by `npm run typecheck` before pushing; skipping it here keeps
  // Liara's build under its 5-minute limit.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
