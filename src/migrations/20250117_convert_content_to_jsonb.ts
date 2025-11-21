import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to convert content columns from text to jsonb (Lexical format)
 * This handles the conversion of text content to Lexical JSON format
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
        'pages_blocks_programs_programs',
        'pages_blocks_sponsors',
        'pages_blocks_rich_text'
      ];
      col_type text;
    BEGIN
      -- Process each block table
      FOREACH block_table IN ARRAY tables_to_process
      LOOP
        -- Check if content column exists and is text type
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = block_table
          AND column_name = 'content';

        -- If content column exists and is text, convert to jsonb
        IF col_type = 'text' OR col_type = 'character varying' THEN
          -- Convert text to Lexical JSON format
          -- Empty text becomes empty Lexical document
          EXECUTE format('
            ALTER TABLE %I 
            ALTER COLUMN content TYPE jsonb 
            USING CASE 
              WHEN content IS NULL OR content = '''' THEN ''{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}''::jsonb
              ELSE json_build_object(
                ''root'', json_build_object(
                  ''children'', json_build_array(
                    json_build_object(
                      ''children'', json_build_array(
                        json_build_object(
                          ''detail'', 0,
                          ''format'', 0,
                          ''mode'', ''normal'',
                          ''style'', '''',
                          ''text'', content,
                          ''type'', ''text'',
                          ''version'', 1
                        )
                      ),
                      ''direction'', ''ltr'',
                      ''format'', '''',
                      ''indent'', 0,
                      ''type'', ''paragraph'',
                      ''version'', 1
                    )
                  ),
                  ''direction'', ''ltr'',
                  ''format'', '''',
                  ''indent'', 0,
                  ''type'', ''root'',
                  ''version'', 1
                )
              )::jsonb
            END
          ', block_table);
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
      col_type text;
    BEGIN
      -- Process each block table
      FOREACH block_table IN ARRAY tables_to_process
      LOOP
        -- Check if content column exists and is jsonb type
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = block_table
          AND column_name = 'content';

        -- If content column exists and is jsonb, convert back to text
        IF col_type = 'jsonb' THEN
          -- Extract text from Lexical JSON
          EXECUTE format('
            ALTER TABLE %I 
            ALTER COLUMN content TYPE text 
            USING CASE 
              WHEN content IS NULL THEN NULL
              ELSE (content->>''root'')::jsonb->''children''->0->>''children''->0->>''text''
            END
          ', block_table);
        END IF;
      END LOOP;
    END $$;
  `)
}

