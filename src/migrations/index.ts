import * as migration_20251114_075118 from './20251114_075118';
import * as migration_20251114_080742 from './20251114_080742';
import * as migration_20251117_191555 from './20251117_191555';
import * as migration_20251117_203058 from './20251117_203058';
import * as migration_20250117_remove_homepages from './20250117_remove_homepages';

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
];
