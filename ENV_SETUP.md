# Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Payload CMS Configuration
PAYLOAD_SECRET=your-payload-secret-key-change-this-in-production

# Database (Supabase PostgreSQL)
DATABASE_URI=postgresql://postgres.hjcdfmdacsrjmsusovjx:mV0vV4vvR7Of5vcv@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# S3 Storage (Supabase Storage)
S3_ENDPOINT=https://hjcdfmdacsrjmsusovjx.storage.supabase.co/storage/v1/s3
S3_REGION=eu-west-1
S3_ACCESS_KEY_ID=7cf924633540a40e08851018d8043094
S3_SECRET_ACCESS_KEY=3e2a4acebb13d6c2cf00966bfede2d218f22aa69a0c20114682581cc01e234b5
S3_BUCKET=payload-media

# Server URL (optional)
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

## Quick Setup

1. **Create the `.env` file** in the root directory with the variables above

2. **Generate a secure PAYLOAD_SECRET**:
   - You can use: `openssl rand -base64 32`
   - Or any secure random string generator

3. **Install dependencies** (including the S3 storage adapter):
   ```bash
   pnpm install
   ```

4. **Create the S3 bucket in Supabase**:
   - Go to your Supabase Storage dashboard
   - Create a bucket named `payload-media` (or update `S3_BUCKET` in `.env`)

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

## Notes

- **PAYLOAD_SECRET**: Must be a secure random string. Generate one with: `openssl rand -base64 32`
- **S3_BUCKET**: Make sure this bucket exists in your Supabase storage dashboard. Default is `payload-media`
- **forcePathStyle**: Set to `true` in the config for Supabase S3-compatible storage

## Configuration

The Payload CMS is configured with:
- **Database**: PostgreSQL via Supabase
- **Storage**: S3-compatible storage via Supabase Storage
- **Media Collection**: Files are stored in the `media` prefix within the S3 bucket

