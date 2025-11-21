import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to create database tables for new V0 blocks:
 * - FAQ Block
 * - Tabs Block
 * - Video Block
 * - Slider Block
 * - Testimonials Block
 * - Logo Cloud Block
 * - Pricing Table Block
 * - Contact Form Block
 * - Map Block
 * - Feature List Block
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create FAQ Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_faq (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_faq_order_idx ON pages_blocks_faq(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_faq_parent_id_idx ON pages_blocks_faq(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_faq_path_idx ON pages_blocks_faq(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_faq_items (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_faq(id) ON DELETE CASCADE,
      question varchar NOT NULL,
      answer jsonb NOT NULL
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_faq_items_order_idx ON pages_blocks_faq_items(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_faq_items_parent_id_idx ON pages_blocks_faq_items(_parent_id);

    -- Create Tabs Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_tabs (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_tabs_order_idx ON pages_blocks_tabs(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_tabs_parent_id_idx ON pages_blocks_tabs(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_tabs_path_idx ON pages_blocks_tabs(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_tabs_tabs (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_tabs(id) ON DELETE CASCADE,
      label varchar NOT NULL,
      content jsonb NOT NULL
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_tabs_tabs_order_idx ON pages_blocks_tabs_tabs(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_tabs_tabs_parent_id_idx ON pages_blocks_tabs_tabs(_parent_id);

    -- Create Video Block table
    CREATE TABLE IF NOT EXISTS pages_blocks_video (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      video_url varchar NOT NULL,
      thumbnail_id integer REFERENCES media(id) ON DELETE SET NULL,
      title varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_video_order_idx ON pages_blocks_video(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_video_parent_id_idx ON pages_blocks_video(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_video_path_idx ON pages_blocks_video(_path);

    -- Create Slider Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_slider (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_slider_order_idx ON pages_blocks_slider(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_slider_parent_id_idx ON pages_blocks_slider(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_slider_path_idx ON pages_blocks_slider(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_slider_slides (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_slider(id) ON DELETE CASCADE,
      image_id integer REFERENCES media(id) ON DELETE SET NULL,
      title varchar,
      text jsonb,
      link varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_slider_slides_order_idx ON pages_blocks_slider_slides(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_slider_slides_parent_id_idx ON pages_blocks_slider_slides(_parent_id);

    -- Create Testimonials Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_testimonials (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_testimonials_order_idx ON pages_blocks_testimonials(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_testimonials_parent_id_idx ON pages_blocks_testimonials(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_testimonials_path_idx ON pages_blocks_testimonials(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_testimonials_testimonials (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_testimonials(id) ON DELETE CASCADE,
      name varchar NOT NULL,
      quote jsonb NOT NULL,
      avatar_id integer REFERENCES media(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_testimonials_testimonials_order_idx ON pages_blocks_testimonials_testimonials(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_testimonials_testimonials_parent_id_idx ON pages_blocks_testimonials_testimonials(_parent_id);

    -- Create Logo Cloud Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_logo_cloud (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      title varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_logo_cloud_order_idx ON pages_blocks_logo_cloud(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_logo_cloud_parent_id_idx ON pages_blocks_logo_cloud(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_logo_cloud_path_idx ON pages_blocks_logo_cloud(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_logo_cloud_logos (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_logo_cloud(id) ON DELETE CASCADE,
      logo_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      url varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_logo_cloud_logos_order_idx ON pages_blocks_logo_cloud_logos(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_logo_cloud_logos_parent_id_idx ON pages_blocks_logo_cloud_logos(_parent_id);

    -- Create Pricing Table Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_pricing_table (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      title varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_order_idx ON pages_blocks_pricing_table(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_parent_id_idx ON pages_blocks_pricing_table(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_path_idx ON pages_blocks_pricing_table(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_pricing_table_plans (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_pricing_table(id) ON DELETE CASCADE,
      title varchar NOT NULL,
      price varchar,
      button_label varchar,
      button_url varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_plans_order_idx ON pages_blocks_pricing_table_plans(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_plans_parent_id_idx ON pages_blocks_pricing_table_plans(_parent_id);

    CREATE TABLE IF NOT EXISTS pages_blocks_pricing_table_plans_features (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_pricing_table_plans(id) ON DELETE CASCADE,
      feature varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_plans_features_order_idx ON pages_blocks_pricing_table_plans_features(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_pricing_table_plans_features_parent_id_idx ON pages_blocks_pricing_table_plans_features(_parent_id);

    -- Create Contact Form Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_contact_form (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      title varchar,
      description jsonb,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_contact_form_order_idx ON pages_blocks_contact_form(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_contact_form_parent_id_idx ON pages_blocks_contact_form(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_contact_form_path_idx ON pages_blocks_contact_form(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_contact_form_fields (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_contact_form(id) ON DELETE CASCADE,
      label varchar NOT NULL,
      name varchar NOT NULL,
      type varchar DEFAULT 'text',
      required boolean DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_contact_form_fields_order_idx ON pages_blocks_contact_form_fields(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_contact_form_fields_parent_id_idx ON pages_blocks_contact_form_fields(_parent_id);

    -- Create Map Block table
    CREATE TABLE IF NOT EXISTS pages_blocks_map (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      map_url varchar NOT NULL,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_map_order_idx ON pages_blocks_map(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_map_parent_id_idx ON pages_blocks_map(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_map_path_idx ON pages_blocks_map(_path);

    -- Create Feature List Block tables
    CREATE TABLE IF NOT EXISTS pages_blocks_feature_list (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      _path text NOT NULL,
      block_label varchar,
      title varchar,
      block_name varchar
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_feature_list_order_idx ON pages_blocks_feature_list(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_feature_list_parent_id_idx ON pages_blocks_feature_list(_parent_id);
    CREATE INDEX IF NOT EXISTS pages_blocks_feature_list_path_idx ON pages_blocks_feature_list(_path);

    CREATE TABLE IF NOT EXISTS pages_blocks_feature_list_features (
      id varchar PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id varchar NOT NULL REFERENCES pages_blocks_feature_list(id) ON DELETE CASCADE,
      icon varchar,
      title varchar,
      description jsonb
    );

    CREATE INDEX IF NOT EXISTS pages_blocks_feature_list_features_order_idx ON pages_blocks_feature_list_features(_order);
    CREATE INDEX IF NOT EXISTS pages_blocks_feature_list_features_parent_id_idx ON pages_blocks_feature_list_features(_parent_id);
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop tables in reverse order (child tables first)
    DROP TABLE IF EXISTS pages_blocks_feature_list_features CASCADE;
    DROP TABLE IF EXISTS pages_blocks_feature_list CASCADE;
    DROP TABLE IF EXISTS pages_blocks_map CASCADE;
    DROP TABLE IF EXISTS pages_blocks_contact_form_fields CASCADE;
    DROP TABLE IF EXISTS pages_blocks_contact_form CASCADE;
    DROP TABLE IF EXISTS pages_blocks_pricing_table_plans_features CASCADE;
    DROP TABLE IF EXISTS pages_blocks_pricing_table_plans CASCADE;
    DROP TABLE IF EXISTS pages_blocks_pricing_table CASCADE;
    DROP TABLE IF EXISTS pages_blocks_logo_cloud_logos CASCADE;
    DROP TABLE IF EXISTS pages_blocks_logo_cloud CASCADE;
    DROP TABLE IF EXISTS pages_blocks_testimonials_testimonials CASCADE;
    DROP TABLE IF EXISTS pages_blocks_testimonials CASCADE;
    DROP TABLE IF EXISTS pages_blocks_slider_slides CASCADE;
    DROP TABLE IF EXISTS pages_blocks_slider CASCADE;
    DROP TABLE IF EXISTS pages_blocks_video CASCADE;
    DROP TABLE IF EXISTS pages_blocks_tabs_tabs CASCADE;
    DROP TABLE IF EXISTS pages_blocks_tabs CASCADE;
    DROP TABLE IF EXISTS pages_blocks_faq_items CASCADE;
    DROP TABLE IF EXISTS pages_blocks_faq CASCADE;
  `)
}

