import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load environment variables
dotenvConfig();

import { uploadMediaIfNeeded } from "./helpers/media.js";
import { upsertDocument, findDocumentBySlug } from "./helpers/upsert.js";
import { mapBlocks } from "./helpers/blockMapper.js";

// Get current file directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------------------------------------
// MAIN SYNC FUNCTION
// -------------------------------------------------------------
export async function syncSite(tenantCode) {
  console.log(`\n🚀 Starting sync for tenant: ${tenantCode}\n`);
  console.log(`📂 Working directory: ${process.cwd()}\n`);

  // Load config dynamically (Payload CLI handles TypeScript files)
  let config;
  try {
    console.log("📋 Loading Payload config...");
    // Payload CLI can resolve TypeScript config files
    const configPath = path.resolve(__dirname, "../../payload.config.ts");
    // Convert to file:// URL for Windows compatibility
    const configUrl = path.isAbsolute(configPath)
      ? `file:///${configPath.replace(/\\/g, "/")}`
      : configPath;
    const configModule = await import(configUrl);
    config = configModule.default;
    console.log("✓ Payload config loaded\n");
  } catch (err) {
    console.error("✗ Failed to load Payload config:", err);
    console.error("Error details:", err.message);
    if (err.stack) console.error("Stack:", err.stack);
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

  // Load JSON
  const syncData = loadSyncData(tenantCode);
  if (!syncData) {
    console.error(`✗ Failed to load sync data for tenant: ${tenantCode}`);
    process.exit(1);
  }

  try {
    // 1 Tenant
    console.log("📋 Syncing Tenant...");
    const tenantId = await syncTenant(payload, syncData.site);
    console.log(`   ✓ Tenant synced (ID: ${tenantId})\n`);

    // 2 Pages
    console.log("📄 Syncing Pages...");
    const pageMap = await syncPages(payload, syncData.pages, tenantId, tenantCode);
    console.log(`   ✓ ${Object.keys(pageMap).length} pages synced\n`);

    // 3 Menu
    console.log("🔗 Syncing Navigation Menu...");
    const menuId = await syncMenu(payload, syncData.menu, tenantId, pageMap);
    console.log(`   ✓ Menu synced (ID: ${menuId})\n`);

    // 4 Header
    console.log("📌 Syncing Header...");
    const headerId = await syncHeader(payload, syncData.header, tenantId, menuId, tenantCode);
    console.log(`   ✓ Header synced (ID: ${headerId})\n`);

    // 5 Footer
    console.log("📎 Syncing Footer...");
    const footerId = await syncFooter(payload, syncData.footer, tenantId);
    console.log(`   ✓ Footer synced (ID: ${footerId})\n`);

    // 6 Posts
    if (syncData.posts && Object.keys(syncData.posts).length > 0) {
      console.log("📰 Syncing Posts...");
      const postsCount = await syncPosts(payload, syncData.posts, tenantId, tenantCode);
      console.log(`   ✓ ${postsCount} posts synced\n`);
    } else {
      console.log("📰 No posts to sync\n");
    }

    console.log("🎉 Sync completed successfully!\n");
  } catch (err) {
    console.error("✗ Sync ERROR:", err);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// LOAD SYNC DATA
// -------------------------------------------------------------
function loadSyncData(tenantCode) {
  try {
    const root = process.cwd();
    const syncDir = path.join(root, "sync-data", tenantCode);

    console.log(`📁 Loading sync data from: ${syncDir}`);

    if (!fs.existsSync(syncDir)) {
      console.error(`✗ Sync directory not found: ${syncDir}`);
      return null;
    }

    console.log("   ✓ Reading site.json...");
    const site = JSON.parse(fs.readFileSync(path.join(syncDir, "site.json"), "utf-8"));
    
    console.log("   ✓ Reading header.json...");
    const header = JSON.parse(fs.readFileSync(path.join(syncDir, "header.json"), "utf-8"));
    
    console.log("   ✓ Reading footer.json...");
    const footer = JSON.parse(fs.readFileSync(path.join(syncDir, "footer.json"), "utf-8"));
    
    console.log("   ✓ Reading menu.json...");
    const menu = JSON.parse(fs.readFileSync(path.join(syncDir, "menu.json"), "utf-8"));

    const pagesDir = path.join(syncDir, "pages");
    const pages = {};

    if (fs.existsSync(pagesDir)) {
      console.log(`   ✓ Reading pages from: ${pagesDir}`);
      const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".json"));
      console.log(`   ✓ Found ${files.length} page file(s)`);

      for (const file of files) {
        const filePath = path.join(pagesDir, file);
        const page = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const slug = page.slug || file.replace(".json", "");
        pages[slug] = page;
        console.log(`     - Loaded page: ${slug}`);
      }
    } else {
      console.log(`   ⚠ No pages directory found at: ${pagesDir}`);
    }

    const postsDir = path.join(syncDir, "posts");
    const posts = {};

    if (fs.existsSync(postsDir)) {
      console.log(`   ✓ Reading posts from: ${postsDir}`);
      const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".json"));
      console.log(`   ✓ Found ${files.length} post file(s)`);

      for (const file of files) {
        const filePath = path.join(postsDir, file);
        const post = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const slug = post.slug || file.replace(".json", "");
        posts[slug] = post;
        console.log(`     - Loaded post: ${slug}`);
      }
    } else {
      console.log(`   ⚠ No posts directory found at: ${postsDir}`);
    }

    console.log("✓ Sync data loaded successfully\n");
    return { site, header, footer, menu, pages, posts };
  } catch (err) {
    console.error("✗ Failed to load sync data:", err);
    console.error("Error details:", err.message);
    if (err.stack) console.error("Stack:", err.stack);
    return null;
  }
}

// -------------------------------------------------------------
// SYNC TENANT
// -------------------------------------------------------------
async function syncTenant(payload, site) {
  return upsertDocument(
    payload,
    "tenants",
    { code: { equals: site.tenant } },
    {
      projectName: site.projectName,
      code: site.tenant,
      domains: site.domains.map((d) => ({ domain: d })),
      status: "active",
    }
  );
}

// -------------------------------------------------------------
// SYNC PAGES
// -------------------------------------------------------------
async function syncPages(payload, pages, tenantId, tenantCode) {
  const results = {};

  const helpers = {
    uploadMediaIfNeeded: (file, tid, alt) =>
      uploadMediaIfNeeded(payload, file, tid, alt, tenantCode),
    payload,
    tenantId,
    tenantCode,
  };

  for (const [slug, page] of Object.entries(pages)) {
    const blocks = await mapBlocks(page.blocks || [], helpers);

    // Normalize slug: lowercase, replace spaces/special chars with hyphens
    // This matches the format used in Pages.ts beforeChange hook
    // Generate from title if slug not provided, as the beforeChange hook does
    const normalizedSlug = page.slug 
      ? (page.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
      : (page.title || slug)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

    console.log(`   📝 Preparing page: "${page.title}" with slug: "${normalizedSlug}"`);

    // Prepare page data - ensure slug is always set
    const pageData = {
      tenant: tenantId,
      title: page.title,
      headline: page.headline || undefined, // Only include if present
      slug: normalizedSlug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      blocks,
      seoTitle: page.seo?.title || "",
      seoDescription: page.seo?.description || "",
    };

    // Log the data being sent for debugging
    console.log(`   📋 Page data:`, JSON.stringify({ ...pageData, blocks: `[${blocks.length} blocks]` }, null, 2));

    const pageId = await upsertDocument(
      payload,
      "pages",
      {
        and: [
          { slug: { equals: normalizedSlug } },
          { tenant: { equals: tenantId } },
        ],
      },
      pageData
    );

    results[slug] = pageId;
    console.log(`   ✓ Page synced: ${page.title}`);
  }

  return results;
}

// -------------------------------------------------------------
// SYNC MENU
// -------------------------------------------------------------
async function syncMenu(payload, menuData, tenantId, pages) {
  const menuItems = await Promise.all(
    menuData.items.map(async (item) => {
      const m = {
        label: item.label,
        type: item.type || "internal",
        openInNewTab: item.openInNewTab || false,
      };

      if (m.type === "internal") {
        m.page = pages[item.page] || undefined;
      } else {
        m.url = item.url || item.page;
      }

      return m;
    })
  );

  return upsertDocument(
    payload,
    "navigation-menus",
    {
      and: [
        { title: { equals: menuData.menuTitle } },
        { tenant: { equals: tenantId } },
      ],
    },
    {
      tenant: tenantId,
      title: menuData.menuTitle,
      items: menuItems,
    }
  );
}

// -------------------------------------------------------------
// SYNC HEADER
// -------------------------------------------------------------
async function syncHeader(payload, headerData, tenantId, menuId, tenantCode) {
  let logoId = null;

  if (headerData.logo) {
    logoId = await uploadMediaIfNeeded(
      payload,
      headerData.logo,
      tenantId,
      "Header Logo",
      tenantCode
    );
  }

  return upsertDocument(
    payload,
    "headers",
    { tenant: { equals: tenantId } },
    {
      tenant: tenantId,
      label: "Default Header",
      logo: logoId,
      navigationMenu: menuId,
      enableTopBar: headerData.topBar?.enabled || false,
      topBarText: headerData.topBar?.text || "",
    }
  );
}

// -------------------------------------------------------------
// SYNC FOOTER
// -------------------------------------------------------------
async function syncFooter(payload, footerData, tenantId) {
  const footerMenus = await Promise.all(
    footerData.footerMenus.map(async (fm) => {
      const menu = await payload.find({
        collection: "navigation-menus",
        where: {
          and: [
            { title: { equals: fm.title } },
            { tenant: { equals: tenantId } },
          ],
        },
        limit: 1,
      });

      return {
        title: fm.title,
        menu: menu.docs[0]?.id,
      };
    })
  );

  return upsertDocument(
    payload,
    "footers",
    { tenant: { equals: tenantId } },
    {
      tenant: tenantId,
      label: "Default Footer",
      copyrightText: footerData.copyrightText,
      footerMenus,
      socialLinks: footerData.socialLinks || [],
    }
  );
}


// -------------------------------------------------------------
// SYNC POSTS
// -------------------------------------------------------------
async function syncPosts(payload, posts, tenantId, tenantCode) {
  let count = 0;

  const helpers = {
    uploadMediaIfNeeded: (file, tid, alt) =>
      uploadMediaIfNeeded(payload, file, tid, alt, tenantCode),
    payload,
    tenantId,
    tenantCode,
  };

  for (const [slug, post] of Object.entries(posts)) {
    // Normalize slug
    const normalizedSlug = post.slug 
      ? (post.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
      : (post.title || slug)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

    console.log(`   📝 Preparing post: "${post.title}" with slug: "${normalizedSlug}"`);

    // Handle featured image if present
    let featuredImageId = null;
    if (post.featuredImage) {
      featuredImageId = await uploadMediaIfNeeded(
        payload,
        post.featuredImage,
        tenantId,
        post.title || "Post Featured Image",
        tenantCode
      );
    }

    // Prepare post data
    const postData = {
      tenant: tenantId,
      title: post.title,
      slug: normalizedSlug,
      excerpt: post.excerpt || "",
      content: post.content || {},
      seoTitle: post.seo?.title || "",
      seoDescription: post.seo?.description || "",
      featuredImage: featuredImageId,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    };

    await upsertDocument(
      payload,
      "posts",
      {
        and: [
          { slug: { equals: normalizedSlug } },
          { tenant: { equals: tenantId } },
        ],
      },
      postData
    );

    count++;
    console.log(`   ✓ Post synced: ${post.title}`);
  }

  return count;
}

// -------------------------------------------------------------
// DEFAULT EXPORT FOR PAYLOAD CLI
// -------------------------------------------------------------
export default async function (args = []) {
  // Payload CLI may pass args as function parameter or via process.argv
  // Try both methods
  const cliArgs = args.length > 0 ? args : process.argv.slice(2);
  
  console.log("📝 Payload CLI script started");
  console.log(`📝 Function args: ${JSON.stringify(args)}`);
  console.log(`📝 Process args: ${process.argv.join(" ")}`);
  console.log(`📝 Parsed CLI args: ${JSON.stringify(cliArgs)}\n`);

  const idx = cliArgs.indexOf("--tenant");

  if (idx === -1 || !cliArgs[idx + 1]) {
    console.error("✗ Error: --tenant <code> is required");
    console.error("Usage: payload run syncSite -- --tenant <tenantCode>");
    console.error(`Received args: ${JSON.stringify(cliArgs)}`);
    process.exit(1);
  }

  const tenant = cliArgs[idx + 1];
  console.log(`✓ Tenant code extracted: ${tenant}\n`);
  
  await syncSite(tenant);
}
