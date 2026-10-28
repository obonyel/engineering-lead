import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@copilotkit/runtime"],
  images: { unoptimized: true },
};

export default nextConfig;
