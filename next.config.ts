import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repository's existing agent instructions under user control.
  agentRules: false,
  // The development launcher otherwise covers the mobile Account destination.
  devIndicators: false,
};

export default nextConfig;
