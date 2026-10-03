import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repository's existing agent instructions under user control.
  agentRules: false,
};

export default nextConfig;
