#!/usr/bin/env node

/**
 * Runner script for scanAllPages
 * Usage: pnpm tsx scripts/run-scan.js --tenant <tenantCode> --path <frontendPath>
 */

import { fileURLToPath } from "url";
import { dirname } from "path";
import { scanAllPages } from "../src/scripts/scanAllPages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");
const pathIdx = args.indexOf("--path");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: pnpm tsx scripts/run-scan.js --tenant <code> --path <frontendSitePath>");
  process.exit(1);
}

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error("✗ Error: --path <frontendSitePath> is required");
  console.error("Usage: pnpm tsx scripts/run-scan.js --tenant <code> --path <frontendSitePath>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
const frontendSitePath = args[pathIdx + 1];

console.log("📝 Running scanAllPages script...\n");

scanAllPages(tenantCode, frontendSitePath)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

