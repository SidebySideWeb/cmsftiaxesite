import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // This migration attempted to make the id column nullable, but id is part of the primary key
  // Primary key columns cannot be nullable, so this migration is a no-op
  // The actual solution was to remove the id field from the CardGridBlock schema
  // This migration is kept for historical purposes but does nothing
  await db.execute(sql`
    -- No-op: id column is part of primary key and cannot be nullable
    -- The solution was to remove the id field from CardGridBlock schema instead
    SELECT 1;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Re-add NOT NULL constraint if needed (for rollback)
  // Note: This might fail if NULL values exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
      ) THEN
        -- Set default value for any NULL ids before adding NOT NULL constraint
        UPDATE pages_blocks_card_grid_cards SET id = 0 WHERE id IS NULL;
        ALTER TABLE pages_blocks_card_grid_cards ALTER COLUMN id SET NOT NULL;
      END IF;
    END $$;
  `)
}

