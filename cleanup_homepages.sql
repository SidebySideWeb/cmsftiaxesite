-- Manual cleanup script for homepages collection removal
-- Run this in your PostgreSQL database before running migrations

-- Drop the foreign key constraint if it exists (ignore error if it doesn't)
DO $$
BEGIN
    ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_homepages_fk;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Drop the homepages_id column if it exists
DO $$
BEGIN
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS homepages_id;
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- Drop the homepages table if it exists
DROP TABLE IF EXISTS homepages CASCADE;

