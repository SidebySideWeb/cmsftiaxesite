#!/usr/bin/env tsx
/**
 * Comprehensive script to scan all frontend pages and populate CMS
 * Scans app directory structure and extracts content from all pages
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { importFrontendSite } from "../src/scripts/importFrontendSite.js";

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scanAllPages(tenantCode, frontendSitePath) {
  console.log(`\n🔍 Scanning all pages for tenant: ${tenantCode}`);
  console.log(`📂 Frontend site path: ${frontendSitePath}\n`);

  // Resolve frontend site path
  const projectRoot = process.cwd();
  let sitePath;
  if (path.isAbsolute(frontendSitePath)) {
    sitePath = frontendSitePath;
  } else if (frontendSitePath.startsWith("..")) {
    sitePath = path.resolve(projectRoot, frontendSitePath);
  } else {
    sitePath = path.resolve(projectRoot, "..", frontendSitePath);
  }

  if (!fs.existsSync(sitePath)) {
    console.error(`✗ Frontend site not found: ${sitePath}`);
    process.exit(1);
  }

  const appDir = path.join(sitePath, "app");
  if (!fs.existsSync(appDir)) {
    console.error(`✗ App directory not found: ${appDir}`);
    process.exit(1);
  }

  console.log("📋 Scanning app directory structure...\n");

  // Find all page files
  const pages = [];
  const scannedFiles = new Set();

  function scanDirectory(dir, routePrefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(appDir, fullPath);

      // Skip special files
      if (entry.name.startsWith("_") || 
          entry.name === "layout.tsx" || 
          entry.name === "loading.tsx" ||
          entry.name === "error.tsx" ||
          entry.name === "not-found.tsx" ||
          entry.name === "globals.css" ||
          entry.name === "robots.ts" ||
          entry.name === "sitemap.ts") {
        continue;
      }

      if (entry.isDirectory()) {
        // Check if it's a dynamic route [slug] or [id]
        if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
          console.log(`   ⚠️  Skipping dynamic route: ${relativePath}`);
          continue;
        }
        // Recursively scan subdirectories
        scanDirectory(fullPath, routePrefix ? `${routePrefix}/${entry.name}` : entry.name);
      } else if (entry.name === "page.tsx" || entry.name === "page.jsx") {
        // Found a page file
        const slug = routePrefix || "homepage";
        const filePath = fullPath;
        
        if (!scannedFiles.has(filePath)) {
          scannedFiles.add(filePath);
          pages.push({
            slug: slug === "page" ? "homepage" : slug,
            filePath,
            route: routePrefix || "/",
          });
          console.log(`   ✓ Found page: ${slug} (${relativePath})`);
        }
      }
    }
  }

  // Start scanning from app directory
  scanDirectory(appDir);

  console.log(`\n📊 Found ${pages.length} page(s) to process:\n`);
  pages.forEach((page, index) => {
    console.log(`   ${index + 1}. ${page.slug} → ${page.route}`);
  });

  console.log("\n🚀 Starting import process...\n");
  console.log("=" .repeat(60));
  
  // Run the import script which will handle all the extraction and population
  await importFrontendSite(tenantCode, frontendSitePath);

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Scan and import completed!");
  console.log(`\n📝 Summary:`);
  console.log(`   - Scanned ${pages.length} page(s)`);
  console.log(`   - Content imported to CMS`);
  console.log(`   - Visit https://cms.ftiaxesite.gr/admin to review\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");
const pathIdx = args.indexOf("--path");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: pnpm tsx scripts/scan-all-pages.js --tenant <tenantCode> --path <frontendSitePath>");
  process.exit(1);
}

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error("✗ Error: --path <frontendSitePath> is required");
  console.error("Usage: pnpm tsx scripts/scan-all-pages.js --tenant <tenantCode> --path <frontendSitePath>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
const frontendSitePath = args[pathIdx + 1];

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

