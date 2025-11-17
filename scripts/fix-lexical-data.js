#!/usr/bin/env node

/**
 * Fix invalid Lexical JSON data in existing records
 * Updates homepages with empty richTextContent to use valid Lexical state
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Empty Lexical state helper
// Lexical requires at least one child node (empty paragraph) - cannot have empty children array
function getEmptyLexicalState() {
  return {
    root: {
      children: [
        {
          children: [],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

async function fixLexicalData() {
  console.log("\n🔧 Fixing invalid Lexical data...\n");

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

  try {
    // Fix homepages
    console.log("📄 Fixing homepages...");
    const homepages = await payload.find({
      collection: "homepages",
      limit: 1000,
      depth: 0,
    });

    const emptyLexicalState = getEmptyLexicalState();
    let fixed = 0;

    for (const homepage of homepages.docs) {
      // Check if richTextContent is invalid (empty object, missing root, or empty children array)
      const needsFix = 
        !homepage.richTextContent || 
        !homepage.richTextContent.root ||
        typeof homepage.richTextContent.root !== 'object' ||
        !Array.isArray(homepage.richTextContent.root.children) ||
        homepage.richTextContent.root.children.length === 0;

      if (needsFix) {
        await payload.update({
          collection: "homepages",
          id: homepage.id,
          data: {
            richTextContent: emptyLexicalState,
          },
        });
        fixed++;
        console.log(`   ✓ Fixed homepage ID: ${homepage.id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixed} homepage(s)\n`);

    // Fix posts if needed
    console.log("📰 Checking posts...");
    const posts = await payload.find({
      collection: "posts",
      limit: 1000,
      depth: 0,
    });

    let fixedPosts = 0;
    for (const post of posts.docs) {
      // Check if content is invalid
      const needsFix = 
        !post.content || 
        !post.content.root ||
        typeof post.content.root !== 'object';

      if (needsFix) {
        await payload.update({
          collection: "posts",
          id: post.id,
          data: {
            content: emptyLexicalState,
          },
        });
        fixedPosts++;
        console.log(`   ✓ Fixed post ID: ${post.id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedPosts} post(s)\n`);
    console.log("🎉 All Lexical data fixed!\n");
  } catch (err) {
    console.error("✗ Error fixing data:", err);
    process.exit(1);
  }
}

fixLexicalData()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

