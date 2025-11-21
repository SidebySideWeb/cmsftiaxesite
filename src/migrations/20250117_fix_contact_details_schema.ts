import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix ContactDetailsBlock schema
 * Handles the transition from old schedule structure to new contact details structure
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- Drop old schedule table if it exists (it was incorrectly named)
      DROP TABLE IF EXISTS pages_blocks_contact_details_items CASCADE;
      
      -- Drop old columns from programs_programs if they exist
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'coach_studies'
      ) THEN
        ALTER TABLE pages_blocks_programs_programs DROP COLUMN IF EXISTS coach_studies CASCADE;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'coach_image_position'
      ) THEN
        ALTER TABLE pages_blocks_programs_programs DROP COLUMN IF EXISTS coach_image_position CASCADE;
      END IF;

      -- Convert content column in programs_programs from text to jsonb if needed
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

      -- Convert coach_bio column from text/textarea to jsonb if needed
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

      -- Ensure timetable structure exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs_timetable_schedule'
      ) THEN
        -- Table will be created by Drizzle automatically
        RAISE NOTICE 'Timetable schedule table will be created by Drizzle';
      END IF;
    END $$;
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  // Re-add columns if needed (for rollback)
  await db.execute(sql`
    DO $$
    BEGIN
      -- Re-add coach_studies column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'coach_studies'
      ) THEN
        ALTER TABLE pages_blocks_programs_programs ADD COLUMN coach_studies text;
      END IF;

      -- Re-add coach_image_position column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'coach_image_position'
      ) THEN
        ALTER TABLE pages_blocks_programs_programs ADD COLUMN coach_image_position text;
      END IF;
    END $$;
  `)
}

