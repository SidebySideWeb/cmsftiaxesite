#!/usr/bin/env tsx
/**
 * Script to fix schema issues by dropping old columns and letting Drizzle recreate them
 * This is safe when resetting tenant content
 */

import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from '@payloadcms/db-postgres';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSchema() {
  console.log("\n🔧 Fixing database schema...\n");

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

  // Init Payload
  let payload;
  try {
    payload = await getPayload({ config });
  } catch (err) {
    console.error("✗ Failed to connect to Payload CMS:", err);
    console.error("This is expected if schema needs fixing. Continuing...\n");
    // We'll use direct DB connection instead
  }

  const db = payload?.db;
  if (!db) {
    console.error("✗ Could not get database connection");
    process.exit(1);
  }

  try {
    console.log("🗑️  Dropping old columns that conflict with new schema...\n");

    // Drop old columns that will be recreated with correct types
    await db.execute(sql`
      DO $$
      DECLARE
        block_table text;
        tables_to_process text[] := ARRAY[
          'pages_blocks_card_grid',
          'pages_blocks_sponsors',
          'pages_blocks_programs',
          'pages_blocks_image_text',
          'pages_blocks_image_gallery'
        ];
      BEGIN
        FOREACH block_table IN ARRAY tables_to_process
        LOOP
          -- Drop subtitle column if it exists (content will be created as jsonb)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'subtitle'
          ) THEN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS subtitle CASCADE', block_table);
            RAISE NOTICE 'Dropped subtitle from %', block_table;
          END IF;

          -- Drop description column if it exists
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'description'
          ) THEN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS description CASCADE', block_table);
            RAISE NOTICE 'Dropped description from %', block_table;
          END IF;
        END LOOP;

        -- Drop description from card_grid_cards
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_card_grid_cards'
          AND column_name = 'description'
        ) THEN
          ALTER TABLE pages_blocks_card_grid_cards DROP COLUMN IF EXISTS description CASCADE;
          RAISE NOTICE 'Dropped description from pages_blocks_card_grid_cards';
        END IF;

        -- Drop additional_info from programs_programs
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_programs_programs'
          AND column_name = 'additional_info'
        ) THEN
          ALTER TABLE pages_blocks_programs_programs DROP COLUMN IF EXISTS additional_info CASCADE;
          RAISE NOTICE 'Dropped additional_info from pages_blocks_programs_programs';
        END IF;
      END $$;
    `);

    console.log("✅ Schema cleanup complete!\n");
    console.log("📝 Drizzle will now create new columns with correct types when Payload initializes.\n");
    
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Error fixing schema:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

fixSchema();

