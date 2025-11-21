#!/usr/bin/env tsx
/**
 * Script to reset/delete all content for a specific tenant
 * WARNING: This will permanently delete all pages, posts, and related content for the tenant
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import { fileURLToPath } from "url";

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetTenant(tenantCode) {
  console.log(`\n⚠️  WARNING: This will DELETE ALL content for tenant: ${tenantCode}`);
  console.log(`   - All pages`);
  console.log(`   - All posts`);
  console.log(`   - All related blocks and media references\n`);

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

  // Find tenant
  let tenant;
  try {
    const tenantResult = await payload.find({
      collection: "tenants",
      where: {
        code: {
          equals: tenantCode,
        },
      },
      limit: 1,
    });

    if (tenantResult.docs.length === 0) {
      console.error(`✗ Tenant "${tenantCode}" not found`);
      process.exit(1);
    }

    tenant = tenantResult.docs[0];
    console.log(`✓ Found tenant: ${tenant.name} (ID: ${tenant.id})\n`);
  } catch (err) {
    console.error("✗ Failed to find tenant:", err);
    process.exit(1);
  }

  const tenantId = tenant.id;
  let deletedCount = 0;

  try {
    // Delete all pages for this tenant
    console.log("🗑️  Deleting pages...");
    const pagesResult = await payload.find({
      collection: "pages",
      where: {
        tenant: {
          equals: tenantId,
        },
      },
      limit: 1000,
      depth: 0,
    });

    for (const page of pagesResult.docs) {
      try {
        await payload.delete({
          collection: "pages",
          id: page.id,
        });
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete page ${page.id}: ${err.message}`);
      }
    }
    console.log(`   ✓ Deleted ${pagesResult.docs.length} page(s)\n`);

    // Delete all posts for this tenant
    console.log("🗑️  Deleting posts...");
    const postsResult = await payload.find({
      collection: "posts",
      where: {
        tenant: {
          equals: tenantId,
        },
      },
      limit: 1000,
      depth: 0,
    });

    for (const post of postsResult.docs) {
      try {
        await payload.delete({
          collection: "posts",
          id: post.id,
        });
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete post ${post.id}: ${err.message}`);
      }
    }
    console.log(`   ✓ Deleted ${postsResult.docs.length} post(s)\n`);

    // Delete navigation menus for this tenant
    console.log("🗑️  Deleting navigation menus...");
    const menusResult = await payload.find({
      collection: "navigation-menus",
      where: {
        tenant: {
          equals: tenantId,
        },
      },
      limit: 1000,
      depth: 0,
    });

    for (const menu of menusResult.docs) {
      try {
        await payload.delete({
          collection: "navigation-menus",
          id: menu.id,
        });
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete menu ${menu.id}: ${err.message}`);
      }
    }
    console.log(`   ✓ Deleted ${menusResult.docs.length} navigation menu(s)\n`);

    // Delete headers for this tenant
    console.log("🗑️  Deleting headers...");
    const headersResult = await payload.find({
      collection: "headers",
      where: {
        tenant: {
          equals: tenantId,
        },
      },
      limit: 1000,
      depth: 0,
    });

    for (const header of headersResult.docs) {
      try {
        await payload.delete({
          collection: "headers",
          id: header.id,
        });
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete header ${header.id}: ${err.message}`);
      }
    }
    console.log(`   ✓ Deleted ${headersResult.docs.length} header(s)\n`);

    // Delete footers for this tenant
    console.log("🗑️  Deleting footers...");
    const footersResult = await payload.find({
      collection: "footers",
      where: {
        tenant: {
          equals: tenantId,
        },
      },
      limit: 1000,
      depth: 0,
    });

    for (const footer of footersResult.docs) {
      try {
        await payload.delete({
          collection: "footers",
          id: footer.id,
        });
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete footer ${footer.id}: ${err.message}`);
      }
    }
    console.log(`   ✓ Deleted ${footersResult.docs.length} footer(s)\n`);

    console.log(`\n✅ Reset complete! Deleted ${deletedCount} total document(s) for tenant "${tenantCode}"\n`);
    console.log("📝 Tenant record preserved. You can now rebuild content according to your specifications.\n");
    
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Error during reset:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const tenantIdx = args.indexOf("--tenant");

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error("✗ Error: --tenant <code> is required");
  console.error("Usage: pnpm tsx scripts/reset-tenant.js --tenant <tenantCode>");
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
resetTenant(tenantCode);

