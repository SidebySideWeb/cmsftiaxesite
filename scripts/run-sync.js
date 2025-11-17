#!/usr/bin/env node

/**
 * Direct Node.js runner for syncSite script
 * Bypasses Payload CLI to ensure proper execution
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { syncSite } from "../src/scripts/syncSite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: node scripts/run-sync.js --tenant <code>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];

console.log("📝 Running syncSite script directly...\n");

syncSite(tenantCode)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

