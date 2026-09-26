// Prepare the Next.js standalone output for Node.js hosting (Hostinger VPS).
// The standalone server ships without `public/` and `.next/static/`, so we copy
// them into the standalone folder after `next build`.
import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = resolve(root, ".next", "standalone");

cpSync(resolve(root, "public"), resolve(standalone, "public"), { recursive: true });

mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(resolve(root, ".next", "static"), resolve(standalone, ".next", "static"), {
  recursive: true,
});

console.log("Standalone output prepared at .next/standalone");
