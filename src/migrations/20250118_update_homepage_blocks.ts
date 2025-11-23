import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to update homepage blocks schema:
 * 1. HeroBlock: Add subtitle, remove content, convert buttonLabel/buttonUrl to cta group
 * 2. CardGridBlock: Remove content from main, change card content to description, convert buttons to cta group
 * 3. ImageGalleryBlock: Change caption to subtitle in image items
 * 4. CtaBannerBlock: Add subtitle, remove content, convert buttonLabel/buttonUrl to cta group
 * 5. SponsorsBlock: Remove title from sponsor items
 * 6. NewsBlock: Create new table for news block
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- ============================================
      -- 1. HeroBlock Updates
      -- ============================================
      
      -- Add subtitle column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_hero ADD COLUMN subtitle varchar;
        RAISE NOTICE 'Added subtitle column to pages_blocks_hero';
      END IF;

      -- Remove content column if it exists (jsonb)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'content'
      ) THEN
        ALTER TABLE pages_blocks_hero DROP COLUMN content;
        RAISE NOTICE 'Removed content column from pages_blocks_hero';
      END IF;

      -- Convert buttonLabel/buttonUrl to cta group (cta_label, cta_url)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'button_label'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_hero RENAME COLUMN button_label TO cta_label;
        RAISE NOTICE 'Renamed button_label to cta_label in pages_blocks_hero';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'button_url'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_hero RENAME COLUMN button_url TO cta_url;
        RAISE NOTICE 'Renamed button_url to cta_url in pages_blocks_hero';
      END IF;

      -- ============================================
      -- 2. CardGridBlock Updates
      -- ============================================
      
      -- Remove content column from main card_grid table if it exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid'
        AND column_name = 'content'
      ) THEN
        ALTER TABLE pages_blocks_card_grid DROP COLUMN content;
        RAISE NOTICE 'Removed content column from pages_blocks_card_grid';
      END IF;

      -- Change content to description in card_grid_cards
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'content'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'description'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN content TO description;
        RAISE NOTICE 'Renamed content to description in pages_blocks_card_grid_cards';
      END IF;

      -- Convert buttonLabel/buttonUrl to cta group in card_grid_cards
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'button_label'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN button_label TO cta_label;
        RAISE NOTICE 'Renamed button_label to cta_label in pages_blocks_card_grid_cards';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'button_url'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN button_url TO cta_url;
        RAISE NOTICE 'Renamed button_url to cta_url in pages_blocks_card_grid_cards';
      END IF;

      -- ============================================
      -- 3. ImageGalleryBlock Updates (Moments)
      -- ============================================
      
      -- Change caption to subtitle in image_gallery_images
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_image_gallery_images'
        AND column_name = 'caption'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_image_gallery_images'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_image_gallery_images RENAME COLUMN caption TO subtitle;
        RAISE NOTICE 'Renamed caption to subtitle in pages_blocks_image_gallery_images';
      END IF;

      -- ============================================
      -- 4. CtaBannerBlock Updates (Newsletter)
      -- ============================================
      
      -- Add subtitle column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner ADD COLUMN subtitle varchar;
        RAISE NOTICE 'Added subtitle column to pages_blocks_cta_banner';
      END IF;

      -- Remove content column if it exists (jsonb)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'content'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner DROP COLUMN content;
        RAISE NOTICE 'Removed content column from pages_blocks_cta_banner';
      END IF;

      -- Convert buttonLabel/buttonUrl to cta group
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'button_label'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner RENAME COLUMN button_label TO cta_label;
        RAISE NOTICE 'Renamed button_label to cta_label in pages_blocks_cta_banner';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'button_url'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner RENAME COLUMN button_url TO cta_url;
        RAISE NOTICE 'Renamed button_url to cta_url in pages_blocks_cta_banner';
      END IF;

      -- ============================================
      -- 5. SponsorsBlock Updates
      -- ============================================
      
      -- Remove title column from sponsor items if it exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_sponsors_sponsors'
        AND column_name = 'title'
      ) THEN
        ALTER TABLE pages_blocks_sponsors_sponsors DROP COLUMN title;
        RAISE NOTICE 'Removed title column from pages_blocks_sponsors_sponsors';
      END IF;

      -- ============================================
      -- 6. NewsBlock - Create new table
      -- ============================================
      
      CREATE TABLE IF NOT EXISTS pages_blocks_news (
        id varchar PRIMARY KEY,
        _order integer NOT NULL,
        _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        _path text NOT NULL,
        block_label varchar,
        title varchar,
        subtitle varchar,
        latest_count integer DEFAULT 3,
        block_name varchar
      );

      CREATE INDEX IF NOT EXISTS pages_blocks_news_order_idx ON pages_blocks_news(_order);
      CREATE INDEX IF NOT EXISTS pages_blocks_news_parent_id_idx ON pages_blocks_news(_parent_id);
      CREATE INDEX IF NOT EXISTS pages_blocks_news_path_idx ON pages_blocks_news(_path);

      RAISE NOTICE 'Created pages_blocks_news table';
    END $$;
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- Reverse NewsBlock
      DROP TABLE IF EXISTS pages_blocks_news CASCADE;

      -- Reverse SponsorsBlock
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_sponsors_sponsors'
        AND column_name = 'title'
      ) THEN
        ALTER TABLE pages_blocks_sponsors_sponsors ADD COLUMN title varchar;
      END IF;

      -- Reverse CtaBannerBlock
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner RENAME COLUMN cta_label TO button_label;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner RENAME COLUMN cta_url TO button_url;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_cta_banner'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_cta_banner DROP COLUMN subtitle;
      END IF;

      -- Reverse ImageGalleryBlock
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_image_gallery_images'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_image_gallery_images RENAME COLUMN subtitle TO caption;
      END IF;

      -- Reverse CardGridBlock
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN cta_label TO button_label;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN cta_url TO button_url;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_card_grid_cards'
        AND column_name = 'description'
      ) THEN
        ALTER TABLE pages_blocks_card_grid_cards RENAME COLUMN description TO content;
      END IF;

      -- Reverse HeroBlock
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'cta_label'
      ) THEN
        ALTER TABLE pages_blocks_hero RENAME COLUMN cta_label TO button_label;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'cta_url'
      ) THEN
        ALTER TABLE pages_blocks_hero RENAME COLUMN cta_url TO button_url;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages_blocks_hero'
        AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE pages_blocks_hero DROP COLUMN subtitle;
      END IF;
    END $$;
  `)
}

