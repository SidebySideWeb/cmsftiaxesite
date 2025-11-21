import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to convert content column in programs_programs table from text to jsonb
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- Convert content column in programs_programs from text to jsonb
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'content'
        AND data_type IN ('text', 'character varying')
      ) THEN
        -- Convert text to Lexical JSON format
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
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- Convert content column back to text
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_programs_programs'
        AND column_name = 'content'
        AND data_type = 'jsonb'
      ) THEN
        ALTER TABLE pages_blocks_programs_programs 
        ALTER COLUMN content TYPE text 
        USING CASE 
          WHEN content IS NULL THEN NULL
          ELSE (content->>'root')::jsonb->'children'->0->>'children'->0->>'text'
        END;
        RAISE NOTICE 'Converted content column in pages_blocks_programs_programs back to text';
      END IF;
    END $$;
  `)
}

