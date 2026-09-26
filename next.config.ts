import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output for Node.js hosting (Hostinger VPS / any
  // non-Vercel host). Produces `.next/standalone/` which runs with
  // `node server.js` — no node_modules needed on the target machine.
  output: "standalone",
};

export default nextConfig;
