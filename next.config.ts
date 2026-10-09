import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Ship the Markdown knowledge base with the serverless functions that read it.
  outputFileTracingIncludes: {
    "/api/chat": ["./content/**/*.md"],
    "/api/retrieve": ["./content/**/*.md"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
