import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('superadmin', 'tenantAdmin', 'editor');
  CREATE TYPE "public"."enum_tenants_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_navigation_menus_items_type" AS ENUM('internal', 'external');
  CREATE TABLE "tenants_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"project_name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_tenants_status" DEFAULT 'active' NOT NULL,
  	"notes" varchar,
  	"primary_color" varchar,
  	"secondary_color" varchar,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"background_image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "pages_blocks_image_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "navigation_menus_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "enum_navigation_menus_items_type" DEFAULT 'internal' NOT NULL,
  	"page_id" integer,
  	"url" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_menus" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "headers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"label" varchar DEFAULT 'Default Header' NOT NULL,
  	"logo_id" integer,
  	"navigation_id" integer,
  	"show_top_bar" boolean DEFAULT false,
  	"top_bar_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "footers_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "footers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"label" varchar DEFAULT 'Default Footer' NOT NULL,
  	"navigation_id" integer,
  	"copyright_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"background_image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepages_blocks_image_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "homepages_blocks_image_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"label" varchar DEFAULT 'Default Homepage' NOT NULL,
  	"slug" varchar DEFAULT 'home' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "media" ADD COLUMN "tenant_id" integer NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "navigation_menus_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "headers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "footers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "homepages_id" integer;
  ALTER TABLE "tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_gallery_images" ADD CONSTRAINT "pages_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_gallery_images" ADD CONSTRAINT "pages_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_gallery" ADD CONSTRAINT "pages_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_menus_items" ADD CONSTRAINT "navigation_menus_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_menus_items" ADD CONSTRAINT "navigation_menus_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_menus" ADD CONSTRAINT "navigation_menus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "headers" ADD CONSTRAINT "headers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "headers" ADD CONSTRAINT "headers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "headers" ADD CONSTRAINT "headers_navigation_id_navigation_menus_id_fk" FOREIGN KEY ("navigation_id") REFERENCES "public"."navigation_menus"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footers_social_links" ADD CONSTRAINT "footers_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footers" ADD CONSTRAINT "footers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footers" ADD CONSTRAINT "footers_navigation_id_navigation_menus_id_fk" FOREIGN KEY ("navigation_id") REFERENCES "public"."navigation_menus"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepages_blocks_hero" ADD CONSTRAINT "homepages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepages_blocks_hero" ADD CONSTRAINT "homepages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepages_blocks_rich_text" ADD CONSTRAINT "homepages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepages_blocks_image_gallery_images" ADD CONSTRAINT "homepages_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepages_blocks_image_gallery_images" ADD CONSTRAINT "homepages_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepages_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepages_blocks_image_gallery" ADD CONSTRAINT "homepages_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepages" ADD CONSTRAINT "homepages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tenants_domains_order_idx" ON "tenants_domains" USING btree ("_order");
  CREATE INDEX "tenants_domains_parent_id_idx" ON "tenants_domains" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tenants_code_idx" ON "tenants" USING btree ("code");
  CREATE INDEX "tenants_logo_idx" ON "tenants" USING btree ("logo_id");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_image_idx" ON "pages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_gallery_images_order_idx" ON "pages_blocks_image_gallery_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_gallery_images_parent_id_idx" ON "pages_blocks_image_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_gallery_images_image_idx" ON "pages_blocks_image_gallery_images" USING btree ("image_id");
  CREATE INDEX "pages_blocks_image_gallery_order_idx" ON "pages_blocks_image_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_gallery_parent_id_idx" ON "pages_blocks_image_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_gallery_path_idx" ON "pages_blocks_image_gallery" USING btree ("_path");
  CREATE INDEX "pages_tenant_idx" ON "pages" USING btree ("tenant_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "posts_tenant_idx" ON "posts" USING btree ("tenant_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "navigation_menus_items_order_idx" ON "navigation_menus_items" USING btree ("_order");
  CREATE INDEX "navigation_menus_items_parent_id_idx" ON "navigation_menus_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_menus_items_page_idx" ON "navigation_menus_items" USING btree ("page_id");
  CREATE INDEX "navigation_menus_tenant_idx" ON "navigation_menus" USING btree ("tenant_id");
  CREATE INDEX "navigation_menus_updated_at_idx" ON "navigation_menus" USING btree ("updated_at");
  CREATE INDEX "navigation_menus_created_at_idx" ON "navigation_menus" USING btree ("created_at");
  CREATE INDEX "headers_tenant_idx" ON "headers" USING btree ("tenant_id");
  CREATE INDEX "headers_logo_idx" ON "headers" USING btree ("logo_id");
  CREATE INDEX "headers_navigation_idx" ON "headers" USING btree ("navigation_id");
  CREATE INDEX "headers_updated_at_idx" ON "headers" USING btree ("updated_at");
  CREATE INDEX "headers_created_at_idx" ON "headers" USING btree ("created_at");
  CREATE INDEX "footers_social_links_order_idx" ON "footers_social_links" USING btree ("_order");
  CREATE INDEX "footers_social_links_parent_id_idx" ON "footers_social_links" USING btree ("_parent_id");
  CREATE INDEX "footers_tenant_idx" ON "footers" USING btree ("tenant_id");
  CREATE INDEX "footers_navigation_idx" ON "footers" USING btree ("navigation_id");
  CREATE INDEX "footers_updated_at_idx" ON "footers" USING btree ("updated_at");
  CREATE INDEX "footers_created_at_idx" ON "footers" USING btree ("created_at");
  CREATE INDEX "homepages_blocks_hero_order_idx" ON "homepages_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepages_blocks_hero_parent_id_idx" ON "homepages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepages_blocks_hero_path_idx" ON "homepages_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepages_blocks_hero_background_image_idx" ON "homepages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "homepages_blocks_rich_text_order_idx" ON "homepages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "homepages_blocks_rich_text_parent_id_idx" ON "homepages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "homepages_blocks_rich_text_path_idx" ON "homepages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "homepages_blocks_image_gallery_images_order_idx" ON "homepages_blocks_image_gallery_images" USING btree ("_order");
  CREATE INDEX "homepages_blocks_image_gallery_images_parent_id_idx" ON "homepages_blocks_image_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "homepages_blocks_image_gallery_images_image_idx" ON "homepages_blocks_image_gallery_images" USING btree ("image_id");
  CREATE INDEX "homepages_blocks_image_gallery_order_idx" ON "homepages_blocks_image_gallery" USING btree ("_order");
  CREATE INDEX "homepages_blocks_image_gallery_parent_id_idx" ON "homepages_blocks_image_gallery" USING btree ("_parent_id");
  CREATE INDEX "homepages_blocks_image_gallery_path_idx" ON "homepages_blocks_image_gallery" USING btree ("_path");
  CREATE INDEX "homepages_tenant_idx" ON "homepages" USING btree ("tenant_id");
  CREATE INDEX "homepages_updated_at_idx" ON "homepages" USING btree ("updated_at");
  CREATE INDEX "homepages_created_at_idx" ON "homepages" USING btree ("created_at");
  ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_navigation_menus_fk" FOREIGN KEY ("navigation_menus_id") REFERENCES "public"."navigation_menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_headers_fk" FOREIGN KEY ("headers_id") REFERENCES "public"."headers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_footers_fk" FOREIGN KEY ("footers_id") REFERENCES "public"."footers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_homepages_fk" FOREIGN KEY ("homepages_id") REFERENCES "public"."homepages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_navigation_menus_id_idx" ON "payload_locked_documents_rels" USING btree ("navigation_menus_id");
  CREATE INDEX "payload_locked_documents_rels_headers_id_idx" ON "payload_locked_documents_rels" USING btree ("headers_id");
  CREATE INDEX "payload_locked_documents_rels_footers_id_idx" ON "payload_locked_documents_rels" USING btree ("footers_id");
  CREATE INDEX "payload_locked_documents_rels_homepages_id_idx" ON "payload_locked_documents_rels" USING btree ("homepages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_menus_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_menus" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "headers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footers_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepages_blocks_image_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepages_blocks_image_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_domains" CASCADE;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_image_gallery_images" CASCADE;
  DROP TABLE "pages_blocks_image_gallery" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "navigation_menus_items" CASCADE;
  DROP TABLE "navigation_menus" CASCADE;
  DROP TABLE "headers" CASCADE;
  DROP TABLE "footers_social_links" CASCADE;
  DROP TABLE "footers" CASCADE;
  DROP TABLE "homepages_blocks_hero" CASCADE;
  DROP TABLE "homepages_blocks_rich_text" CASCADE;
  DROP TABLE "homepages_blocks_image_gallery_images" CASCADE;
  DROP TABLE "homepages_blocks_image_gallery" CASCADE;
  DROP TABLE "homepages" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_tenants_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT "media_tenant_id_tenants_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_navigation_menus_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_headers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_footers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_homepages_fk";
  
  DROP INDEX "users_tenant_idx";
  DROP INDEX "media_tenant_idx";
  DROP INDEX "payload_locked_documents_rels_tenants_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_navigation_menus_id_idx";
  DROP INDEX "payload_locked_documents_rels_headers_id_idx";
  DROP INDEX "payload_locked_documents_rels_footers_id_idx";
  DROP INDEX "payload_locked_documents_rels_homepages_id_idx";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "tenant_id";
  ALTER TABLE "media" DROP COLUMN "tenant_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tenants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "navigation_menus_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "headers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "footers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "homepages_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_tenants_status";
  DROP TYPE "public"."enum_navigation_menus_items_type";`)
}
