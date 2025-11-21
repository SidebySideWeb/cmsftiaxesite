#!/usr/bin/env tsx
/**
 * Script to directly rename columns in block tables
 * Bypasses Drizzle interactive prompts
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from '@payloadcms/db-postgres';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renameColumns() {
  console.log("🔄 Renaming columns to match standardized schema...\n");

  // Load config
  let config;
  try {
    const configPath = path.resolve(__dirname, "../payload.config.ts");
    const configUrl = path.isAbsolute(configPath)
      ? `file:///${configPath.replace(/\\/g, "/")}`
      : configPath;
    const configModule = await import(configUrl);
    config = configModule.default;
  } catch (err) {
    console.error("✗ Failed to load Payload config:", err);
    process.exit(1);
  }

  // Init Payload to get database connection
  let payload;
  try {
    payload = await getPayload({ config });
  } catch (err) {
    console.error("✗ Failed to connect to Payload CMS:", err);
    process.exit(1);
  }

  const db = payload.db;

  try {
    // Rename columns in hero blocks
    console.log("📋 Renaming columns in pages_blocks_hero...");
    
    // Rename cta_label to button_label
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_hero' 
          AND column_name = 'cta_label'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_hero' 
          AND column_name = 'button_label'
        ) THEN
          ALTER TABLE pages_blocks_hero RENAME COLUMN cta_label TO button_label;
          RAISE NOTICE 'Renamed cta_label to button_label';
        ELSE
          RAISE NOTICE 'cta_label column does not exist or button_label already exists';
        END IF;
      END $$;
    `);
    console.log("   ✓ button_label");

    // Rename cta_url to button_url
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_hero' 
          AND column_name = 'cta_url'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_hero' 
          AND column_name = 'button_url'
        ) THEN
          ALTER TABLE pages_blocks_hero RENAME COLUMN cta_url TO button_url;
          RAISE NOTICE 'Renamed cta_url to button_url';
        ELSE
          RAISE NOTICE 'cta_url column does not exist or button_url already exists';
        END IF;
      END $$;
    `);
    console.log("   ✓ button_url\n");

    console.log("✅ Column renames completed successfully!\n");
    process.exit(0);
  } catch (err) {
    console.error("✗ Error renaming columns:", err);
    process.exit(1);
  }
}

renameColumns();

