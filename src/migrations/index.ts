import * as migration_20251114_075118 from './20251114_075118';
import * as migration_20251114_080742 from './20251114_080742';
import * as migration_20251117_191555 from './20251117_191555';
import * as migration_20251117_203058 from './20251117_203058';
import * as migration_20250117_remove_homepages from './20250117_remove_homepages';
import * as migration_20250117_rename_block_columns from './20250117_rename_block_columns';
import * as migration_20250117_convert_content_to_jsonb from './20250117_convert_content_to_jsonb';
import * as migration_20250117_fix_contact_details_schema from './20250117_fix_contact_details_schema';
import * as migration_20250117_convert_programs_content from './20250117_convert_programs_content';

export const migrations = [
  {
    up: migration_20251114_075118.up,
    down: migration_20251114_075118.down,
    name: '20251114_075118',
  },
  {
    up: migration_20251114_080742.up,
    down: migration_20251114_080742.down,
    name: '20251114_080742'
  },
  {
    up: migration_20251117_191555.up,
    down: migration_20251117_191555.down,
    name: '20251117_191555'
  },
  {
    up: migration_20251117_203058.up,
    down: migration_20251117_203058.down,
    name: '20251117_203058'
  },
  {
    up: migration_20250117_remove_homepages.up,
    down: migration_20250117_remove_homepages.down,
    name: '20250117_remove_homepages'
  },
  {
    up: migration_20250117_rename_block_columns.up,
    down: migration_20250117_rename_block_columns.down,
    name: '20250117_rename_block_columns'
  },
  {
    up: migration_20250117_convert_content_to_jsonb.up,
    down: migration_20250117_convert_content_to_jsonb.down,
    name: '20250117_convert_content_to_jsonb'
  },
  {
    up: migration_20250117_fix_contact_details_schema.up,
    down: migration_20250117_fix_contact_details_schema.down,
    name: '20250117_fix_contact_details_schema'
  },
  {
    up: migration_20250117_convert_programs_content.up,
    down: migration_20250117_convert_programs_content.down,
    name: '20250117_convert_programs_content'
  },
];
