#!/usr/bin/env tsx
/**
 * Script to fix schema by connecting directly to PostgreSQL
 * Bypasses Payload/Drizzle initialization to avoid prompts
 */

import { config as dotenvConfig } from "dotenv";
import pg from 'pg';
const { Client } = pg;

dotenvConfig();

async function fixSchemaDirect() {
  console.log("\n🔧 Fixing database schema (direct PostgreSQL connection)...\n");

  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    console.error("✗ DATABASE_URI not found in environment variables");
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUri,
  });

  try {
    await client.connect();
    console.log("✓ Connected to PostgreSQL\n");

    // Drop old columns that conflict with new schema
    console.log("🗑️  Dropping old columns...\n");

    await client.query(`
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
          -- Drop subtitle column if it exists
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
    console.log("📝 Old columns dropped. Drizzle will create new ones with correct types.\n");
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Error fixing schema:", err);
    if (err.stack) console.error(err.stack);
    await client.end();
    process.exit(1);
  }
}

fixSchemaDirect();

