#!/usr/bin/env tsx
/**
 * Enhanced script to scan all frontend pages, extract content, and populate CMS
 * Intelligently extracts content from React/Next.js page files
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenvConfig();

import { uploadMediaIfNeeded } from "../src/scripts/helpers/media.js";
import { upsertDocument } from "../src/scripts/helpers/upsert.js";
import { mapBlocks } from "../src/scripts/helpers/blockMapper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find all page.tsx files in app directory
 */
function findPageFiles(appDir, pages = [], currentRoute = "") {
  if (!fs.existsSync(appDir)) {
    return pages;
  }

  const entries = fs.readdirSync(appDir, { withFileTypes: true });

  for (const entry of entries) {
    // Skip special files and directories
    if (
      entry.name.startsWith("_") ||
      entry.name === "layout.tsx" ||
      entry.name === "loading.tsx" ||
      entry.name === "error.tsx" ||
      entry.name === "not-found.tsx" ||
      entry.name === "globals.css" ||
      entry.name === "robots.ts" ||
      entry.name === "sitemap.ts" ||
      entry.name === "favicon.ico"
    ) {
      continue;
    }

    const fullPath = path.join(appDir, entry.name);

    if (entry.isDirectory()) {
      // Skip dynamic routes like [slug]
      if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
        continue;
      }
      // Recursively scan subdirectories
      const newRoute = currentRoute ? `${currentRoute}/${entry.name}` : entry.name;
      findPageFiles(fullPath, pages, newRoute);
    } else if (entry.name === "page.tsx" || entry.name === "page.jsx") {
      // Found a page file
      const slug = currentRoute || "homepage";
      pages.push({
        slug: slug === "page" ? "homepage" : slug,
        filePath: fullPath,
        route: currentRoute || "/",
      });
    }
  }

  return pages;
}

/**
 * Extract content from a page file
 */
function extractPageContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const blocks = [];

    // Extract hero section
    const heroMatch = content.match(/Hero.*?section|hero.*?section/gi);
    if (heroMatch) {
      // Try to extract hero data
      const titleMatch = content.match(/title[:\s]*["']([^"']+)["']/i);
      const imageMatch = content.match(/src[:\s]*["']([^"']+)["']/i);
      const buttonMatch = content.match(/href[:\s]*["']([^"']+)["']/i);
      const buttonTextMatch = content.match(/>([^<]+)<\/Link>/i);

      if (titleMatch || imageMatch) {
        blocks.push({
          blockType: "hero",
          title: titleMatch ? titleMatch[1] : null,
          backgroundImage: imageMatch ? imageMatch[1] : null,
          buttonLabel: buttonTextMatch ? buttonTextMatch[1].trim() : null,
          buttonUrl: buttonMatch ? buttonMatch[1] : null,
        });
      }
    }

    // Extract image-text sections (Welcome, About, etc.)
    const imageTextMatches = content.matchAll(
      /ImageText|Welcome|About|image.*?text/gi
    );
    if (imageTextMatches) {
      const titleMatch = content.match(/h2[^>]*>([^<]+)</i);
      const imageMatch = content.match(/src[:\s]*["']([^"']+)["']/i);
      const textMatches = content.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);

      if (titleMatch || imageMatch) {
        const paragraphs = Array.from(textMatches)
          .map((m) => m[1])
          .join("\n\n");

        blocks.push({
          blockType: "imageText",
          title: titleMatch ? titleMatch[1] : null,
          image: imageMatch ? imageMatch[1] : null,
          content: paragraphs || null,
        });
      }
    }

    // Extract card grids (Programs, Features, etc.)
    const cardGridMatches = content.matchAll(/Card|card|Program|program/gi);
    if (cardGridMatches) {
      const titleMatch = content.match(/h2[^>]*>([^<]+)</i);
      const subtitleMatch = content.match(/<p[^>]*class[^>]*>([^<]+)</i);

      // Try to extract card data from arrays or objects
      const cardDataMatches = content.matchAll(
        /\{[\s\S]{0,500}?title[:\s]*["']([^"']+)["'][\s\S]{0,500}?\}/gi
      );

      const cards = [];
      if (cardDataMatches) {
        for (const match of Array.from(cardDataMatches).slice(0, 10)) {
          // Extract card properties
          const cardTitle = match[1];
          const cardImage = match[0].match(/src[:\s]*["']([^"']+)["']/i)?.[1];
          const cardDesc = match[0].match(/description[:\s]*["']([^"']+)["']/i)?.[1];
          const cardButton = match[0].match(/href[:\s]*["']([^"']+)["']/i)?.[1];

          if (cardTitle) {
            cards.push({
              title: cardTitle,
              image: cardImage || null,
              content: cardDesc || null,
              buttonUrl: cardButton || null,
              buttonLabel: cardButton ? "Μάθετε Περισσότερα" : null,
            });
          }
        }
      }

      if (titleMatch || cards.length > 0) {
        blocks.push({
          blockType: "cardGrid",
          title: titleMatch ? titleMatch[1] : null,
          subtitle: subtitleMatch ? subtitleMatch[1] : null,
          cards: cards.length > 0 ? cards : null,
        });
      }
    }

    // Extract image gallery (Moments, Gallery)
    const galleryMatches = content.matchAll(/Gallery|gallery|Moments|moments/gi);
    if (galleryMatches) {
      const titleMatch = content.match(/h2[^>]*>([^<]+)</i);
      const subtitleMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
      const imageMatches = content.matchAll(/src[:\s]*["']([^"']+\.(jpg|jpeg|png|webp))["']/gi);

      const images = [];
      for (const match of Array.from(imageMatches).slice(0, 10)) {
        images.push({
          image: match[1],
        });
      }

      if (titleMatch || images.length > 0) {
        blocks.push({
          blockType: "imageGallery",
          title: titleMatch ? titleMatch[1] : null,
          subtitle: subtitleMatch ? subtitleMatch[1] : null,
          images: images.length > 0 ? images : null,
        });
      }
    }

    // Extract sponsors
    const sponsorMatches = content.matchAll(/Sponsor|sponsor|Χορηγός/gi);
    if (sponsorMatches) {
      const titleMatch = content.match(/h2[^>]*>([^<]+)</i);
      const subtitleMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);

      blocks.push({
        blockType: "sponsors",
        title: titleMatch ? titleMatch[1] : "Οι Υποστηρικτές μας",
        subtitle: subtitleMatch ? subtitleMatch[1] : "Ευχαριστούμε θερμά τους υποστηρικτές μας",
        sponsors: [],
      });
    }

    // Extract CTA banner
    const ctaMatches = content.matchAll(/CTA|cta|Call.*Action|newsletter/gi);
    if (ctaMatches) {
      const titleMatch = content.match(/h2[^>]*>([^<]+)</i);
      const descMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
      const buttonMatch = content.match(/>([^<]+)<\/Button>/i);

      if (titleMatch) {
        blocks.push({
          blockType: "ctaBanner",
          title: titleMatch[1],
          content: descMatch ? descMatch[1] : null,
          buttonLabel: buttonMatch ? buttonMatch[1].trim() : null,
          buttonUrl: "/contact",
        });
      }
    }

    return blocks;
  } catch (error) {
    console.error(`Error extracting content from ${filePath}:`, error.message);
    return [];
  }
}

async function scanAndPopulate(tenantCode, frontendSitePath) {
  console.log(`\n🔍 Scanning all pages for tenant: ${tenantCode}`);
  console.log(`📂 Frontend site path: ${frontendSitePath}\n`);

  // Load config
  let config;
  try {
    console.log("📋 Loading Payload config...");
    const configPath = path.resolve(__dirname, "../payload.config.ts");
    const configUrl = path.isAbsolute(configPath)
      ? `file:///${configPath.replace(/\\/g, "/")}`
      : configPath;
    const configModule = await import(configUrl);
    config = configModule.default;
    console.log("✓ Payload config loaded\n");
  } catch (err) {
    console.error("✗ Failed to load Payload config:", err);
    process.exit(1);
  }

  // Init Payload
  let payload;
  try {
    payload = await getPayload({ config });
    console.log("✓ Connected to Payload CMS\n");
  } catch (err) {
    console.error("✗ Failed to connect to Payload CMS:", err);
    process.exit(1);
  }

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

  // Find app directory
  const appDir = path.join(sitePath, "app");
  if (!fs.existsSync(appDir)) {
    console.error(`✗ App directory not found: ${appDir}`);
    process.exit(1);
  }

  // Get or create tenant
  console.log("📋 Getting tenant...");
  const tenantResult = await payload.find({
    collection: "tenants",
    where: { code: { equals: tenantCode } },
    limit: 1,
  });

  let tenantId;
  if (tenantResult.docs.length > 0) {
    tenantId = tenantResult.docs[0].id;
    console.log(`   ✓ Found tenant (ID: ${tenantId})\n`);
  } else {
    console.error(`✗ Tenant "${tenantCode}" not found. Please create it first.`);
    process.exit(1);
  }

  // Find all pages
  console.log("🔍 Scanning app directory...");
  const pages = findPageFiles(appDir);
  console.log(`   ✓ Found ${pages.length} page(s)\n`);

  // Process each page
  for (const page of pages) {
    console.log(`📄 Processing: ${page.slug}...`);
    
    // Extract content from page file
    const blocks = extractPageContent(page.filePath);
    console.log(`   ✓ Extracted ${blocks.length} block(s)`);

    // Map blocks to CMS format
    const mappedBlocks = blocks.map((block) => mapBlocks(block, tenantId, payload));

    // Create or update page in CMS
    const pageData = {
      title: page.slug.charAt(0).toUpperCase() + page.slug.slice(1),
      slug: page.slug,
      tenant: tenantId,
      blocks: mappedBlocks,
    };

    try {
      await upsertDocument(
        payload,
        "pages",
        { slug: { equals: page.slug }, tenant: { equals: tenantId } },
        pageData
      );
      console.log(`   ✓ Page created/updated: ${page.slug}\n`);
    } catch (error) {
      console.error(`   ✗ Error creating page ${page.slug}:`, error.message);
    }
  }

  console.log("\n✅ Scan and populate completed!");
  console.log(`\n📊 Summary:`);
  console.log(`   - Scanned ${pages.length} page(s)`);
  console.log(`   - Content populated in CMS`);
  console.log(`   - Visit https://cms.ftiaxesite.gr/admin to review\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");
const pathIdx = args.indexOf("--path");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: pnpm tsx scripts/scan-all-pages-enhanced.js --tenant <tenantCode> --path <frontendSitePath>");
  process.exit(1);
}

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error("✗ Error: --path <frontendSitePath> is required");
  console.error("Usage: pnpm tsx scripts/scan-all-pages-enhanced.js --tenant <tenantCode> --path <frontendSitePath>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
const frontendSitePath = args[pathIdx + 1];

scanAndPopulate(tenantCode, frontendSitePath)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

