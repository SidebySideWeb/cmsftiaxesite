import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload, db }: MigrateUpArgs): Promise<void> {
  // Remove homepages collection - migrate data to pages if needed
  // Clean up constraints and columns safely
  await db.execute(sql`
    DO $$
    BEGIN
      -- Drop foreign key constraint if it exists (ignore error if it doesn't)
      BEGIN
        ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_homepages_fk;
      EXCEPTION
        WHEN undefined_object THEN NULL;
        WHEN OTHERS THEN NULL;
      END;

      -- Drop the homepages_id column if it exists
      BEGIN
        ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS homepages_id;
      EXCEPTION
        WHEN undefined_column THEN NULL;
        WHEN OTHERS THEN NULL;
      END;

      -- Drop the homepages table if it exists
      DROP TABLE IF EXISTS homepages CASCADE;
    END $$;
  `)
}

export async function down({ payload, db }: MigrateDownArgs): Promise<void> {
  // This migration is not reversible - homepages collection has been removed
  // If you need to restore it, you'll need to recreate the collection manually
}

