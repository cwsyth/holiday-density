import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/holiday-density",
  assetPrefix: "/holiday-density",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
