import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Payload adapters & plugins
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'

// Collections (NO .js extensions for TS)
import { Users } from './src/collections/Users'
import { Tenants } from './src/collections/Tenants'
import { Pages } from './src/collections/Pages'
import { Posts } from './src/collections/Posts'
import { NavigationMenus } from './src/collections/NavigationMenus'
import { Headers } from './src/collections/Headers'
import { Footers } from './src/collections/Footers'
import { Media } from './src/collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getServerURL = () => {
  if (process.env.PAYLOAD_SERVER_URL) return process.env.PAYLOAD_SERVER_URL
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)
    return 'http://localhost:3000'

  return 'https://cms.ftiaxesite.gr'
}

export default buildConfig({
  serverURL: getServerURL(),

  cors: [
    'https://kallitechnia.gr',
    'https://www.kallitechnia.gr',
    'https://ftiaxesite.gr',
    'https://www.ftiaxesite.gr',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  csrf: [
    'https://kallitechnia.gr',
    'https://www.kallitechnia.gr',
    'https://ftiaxesite.gr',
    'https://www.ftiaxesite.gr',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Tenants,
    Pages,
    Posts,
    NavigationMenus,
    Headers,
    Footers,
    Media,
  ],

  editor: lexicalEditor({}),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  sharp,

  plugins: [
    s3Storage({
      collections: {
        media: { prefix: 'media' },
      },
      bucket: process.env.S3_BUCKET || 'cmsftiaxesite',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'eu-west-1',
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
      },
    }),
  ],
})
