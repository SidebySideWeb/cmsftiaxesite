#!/usr/bin/env node

/**
 * Direct Node.js runner for importFrontendSite script
 * Bypasses Payload CLI to ensure proper execution
 */

import { fileURLToPath } from "url";
import { dirname } from "path";
import { importFrontendSite } from "../src/scripts/importFrontendSite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");
const pathIdx = args.indexOf("--path");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: node scripts/run-import.js --tenant <code> --path <frontendSitePath>");
  process.exit(1);
}

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error("✗ Error: --path <frontendSitePath> is required");
  console.error("Usage: node scripts/run-import.js --tenant <code> --path <frontendSitePath>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
const frontendSitePath = args[pathIdx + 1];

console.log("📝 Running importFrontendSite script directly...\n");

importFrontendSite(tenantCode, frontendSitePath)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

