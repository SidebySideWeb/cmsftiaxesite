import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Remove unique constraint on card ID field if it exists
  // Card IDs don't need to be globally unique - they're just identifiers within a card grid
  // Note: We preserve the primary key constraint, only removing unique constraints on the 'id' column
  await db.execute(sql`
    DO $$
    DECLARE
      constraint_record record;
      index_record record;
      table_exists boolean;
    BEGIN
      -- Check if table exists
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
      ) INTO table_exists;
      
      IF table_exists THEN
        -- Drop ALL unique constraints except primary key
        FOR constraint_record IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'pages_blocks_card_grid_cards'::regclass
            AND contype = 'u'  -- Unique constraint
            AND conname != 'pages_blocks_card_grid_cards_pkey'  -- Exclude primary key
        LOOP
          EXECUTE format('ALTER TABLE pages_blocks_card_grid_cards DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        END LOOP;
        
        -- Drop ALL unique indexes except primary key
        FOR index_record IN
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = 'pages_blocks_card_grid_cards'
            AND schemaname = 'public'
            AND indexdef LIKE '%UNIQUE%'
            AND indexname != 'pages_blocks_card_grid_cards_pkey'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', index_record.indexname);
        END LOOP;
        
        -- Make the id column nullable to allow NULL values (which are exempt from unique constraints)
        -- This allows cards without IDs to be created
        BEGIN
          ALTER TABLE pages_blocks_card_grid_cards ALTER COLUMN id DROP NOT NULL;
        EXCEPTION
          WHEN OTHERS THEN
            -- Column might already be nullable or not exist, ignore error
            NULL;
        END;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Re-add unique constraint if needed (for rollback)
  // Note: This might fail if duplicate IDs exist
  await db.execute(sql`
    -- We don't recreate the constraint in rollback since it was causing issues
    -- If you need to restore it, you'll need to ensure all IDs are unique first
  `)
}

