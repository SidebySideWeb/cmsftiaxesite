#!/usr/bin/env tsx
/**
 * Script to fix all text columns that need to be jsonb
 * Runs directly on PostgreSQL before Payload initializes
 */

import { config as dotenvConfig } from "dotenv";
import pg from 'pg';
const { Client } = pg;

dotenvConfig();

async function fixAllJsonbColumns() {
  console.log("\n🔧 Fixing all text-to-jsonb column conversions...\n");

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

    // Function to convert text to Lexical JSON
    const textToLexicalJson = (text) => {
      if (!text || text.trim() === '') {
        return '{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';
      }
      // Escape single quotes for SQL
      const escapedText = text.replace(/'/g, "''");
      return `json_build_object(
        'root', json_build_object(
          'children', json_build_array(
            json_build_object(
              'children', json_build_array(
                json_build_object(
                  'detail', 0,
                  'format', 0,
                  'mode', 'normal',
                  'style', '',
                  'text', '${escapedText}',
                  'type', 'text',
                  'version', 1
                )
              ),
              'direction', 'ltr',
              'format', '',
              'indent', 0,
              'type', 'paragraph',
              'version', 1
            )
          ),
          'direction', 'ltr',
          'format', '',
          'indent', 0,
          'type', 'root',
          'version', 1
        )
      )::jsonb`;
    };

    console.log("🔄 Converting text columns to jsonb...\n");

    // Convert content in programs_programs
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_programs_programs'
          AND column_name = 'content'
          AND data_type IN ('text', 'character varying')
        ) THEN
          ALTER TABLE pages_blocks_programs_programs 
          ALTER COLUMN content TYPE jsonb 
          USING CASE 
            WHEN content IS NULL OR content = '' THEN '{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb
            ELSE json_build_object(
              'root', json_build_object(
                'children', json_build_array(
                  json_build_object(
                    'children', json_build_array(
                      json_build_object(
                        'detail', 0,
                        'format', 0,
                        'mode', 'normal',
                        'style', '',
                        'text', content,
                        'type', 'text',
                        'version', 1
                      )
                    ),
                    'direction', 'ltr',
                    'format', '',
                    'indent', 0,
                    'type', 'paragraph',
                    'version', 1
                  )
                ),
                'direction', 'ltr',
                'format', '',
                'indent', 0,
                'type', 'root',
                'version', 1
              )
            )::jsonb
          END;
          RAISE NOTICE 'Converted content column in pages_blocks_programs_programs to jsonb';
        END IF;
      END $$;
    `);
    console.log("   ✓ programs_programs.content");

    // Convert coach_bio in programs_programs
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pages_blocks_programs_programs'
          AND column_name = 'coach_bio'
          AND data_type IN ('text', 'character varying')
        ) THEN
          ALTER TABLE pages_blocks_programs_programs 
          ALTER COLUMN coach_bio TYPE jsonb 
          USING CASE 
            WHEN coach_bio IS NULL OR coach_bio = '' THEN '{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb
            ELSE json_build_object(
              'root', json_build_object(
                'children', json_build_array(
                  json_build_object(
                    'children', json_build_array(
                      json_build_object(
                        'detail', 0,
                        'format', 0,
                        'mode', 'normal',
                        'style', '',
                        'text', coach_bio,
                        'type', 'text',
                        'version', 1
                      )
                    ),
                    'direction', 'ltr',
                    'format', '',
                    'indent', 0,
                    'type', 'paragraph',
                    'version', 1
                  )
                ),
                'direction', 'ltr',
                'format', '',
                'indent', 0,
                'type', 'root',
                'version', 1
              )
            )::jsonb
          END;
          RAISE NOTICE 'Converted coach_bio column in pages_blocks_programs_programs to jsonb';
        END IF;
      END $$;
    `);
    console.log("   ✓ programs_programs.coach_bio");

    console.log("\n✅ All jsonb conversions completed!\n");
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Error fixing columns:", err);
    if (err.stack) console.error(err.stack);
    await client.end();
    process.exit(1);
  }
}

fixAllJsonbColumns();

