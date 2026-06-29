import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/export-pdf": ["node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/export-cover": ["node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/export-kindle-cover": ["node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;