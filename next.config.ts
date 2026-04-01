import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Tauri (npm run build:tauri)
  // Normal dev/build uses server mode for API routes
  ...(process.env.TAURI_BUILD === '1' ? { output: 'export' } : {}),
};

export default nextConfig;
