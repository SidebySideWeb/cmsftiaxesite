import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to rename columns in ALL block tables to match standardized field names:
 * - description/subtitle → content (for all blocks)
 * - cta_label → button_label (for all blocks)
 * - cta_url → button_url (for all blocks)
 * 
 * This preserves existing data while aligning with the new standardized block structure.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      block_table text;
      tables_to_process text[] := ARRAY[
        'pages_blocks_cta_banner',
        'pages_blocks_hero',
        'pages_blocks_card_grid',
        'pages_blocks_image_text',
        'pages_blocks_image_gallery',
        'pages_blocks_programs',
        'pages_blocks_sponsors',
        'pages_blocks_rich_text'
      ];
    BEGIN
      -- Process each block table
      FOREACH block_table IN ARRAY tables_to_process
      LOOP
        -- Rename description to content (if exists and content doesn't)
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'description'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'content'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN description TO content', block_table);
        END IF;

        -- Rename subtitle to content (if exists and content doesn't)
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'subtitle'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'content'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN subtitle TO content', block_table);
        END IF;

        -- Rename cta_label to button_label
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'cta_label'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'button_label'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN cta_label TO button_label', block_table);
        END IF;

        -- Rename cta_url to button_url
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'cta_url'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'button_url'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN cta_url TO button_url', block_table);
        END IF;
      END LOOP;
    END $$;
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      block_table text;
      tables_to_process text[] := ARRAY[
        'pages_blocks_cta_banner',
        'pages_blocks_hero',
        'pages_blocks_card_grid',
        'pages_blocks_image_text',
        'pages_blocks_image_gallery',
        'pages_blocks_programs',
        'pages_blocks_sponsors',
        'pages_blocks_rich_text'
      ];
    BEGIN
      -- Process each block table (reverse order)
      FOREACH block_table IN ARRAY tables_to_process
      LOOP
        -- Rename content back to description (if it was renamed from description)
        -- Note: We can't determine original name, so we'll rename to description for cta_banner
        -- and subtitle for others
        IF block_table = 'pages_blocks_cta_banner' THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'content'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'description'
          ) THEN
            EXECUTE format('ALTER TABLE %I RENAME COLUMN content TO description', block_table);
          END IF;
        ELSE
          -- For other blocks, rename content back to subtitle
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'content'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = block_table
            AND column_name = 'subtitle'
          ) THEN
            EXECUTE format('ALTER TABLE %I RENAME COLUMN content TO subtitle', block_table);
          END IF;
        END IF;

        -- Rename button_label back to cta_label
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'button_label'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'cta_label'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN button_label TO cta_label', block_table);
        END IF;

        -- Rename button_url back to cta_url
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'button_url'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = block_table
          AND column_name = 'cta_url'
        ) THEN
          EXECUTE format('ALTER TABLE %I RENAME COLUMN button_url TO cta_url', block_table);
        END IF;
      END LOOP;
    END $$;
  `)
}

