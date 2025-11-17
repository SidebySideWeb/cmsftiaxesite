# Tenant Addition Workflow

This document explains how to add a new tenant to the Payload CMS system using the sync and import scripts.

## Overview

There are two ways to add tenant data:

1. **Sync Script** - Import from JSON files in `sync-data/<tenantCode>/`
2. **Import Script** - Import directly from a frontend Next.js project

---

## Prerequisites

1. **Environment Setup**
   - Ensure `.env` file exists with required variables:
     - `PAYLOAD_SECRET`
     - `DATABASE_URI`
     - `S3_*` variables (if using S3 storage)

2. **Dependencies Installed**
   ```bash
   pnpm install
   ```

---

## Method 1: Sync from JSON Files

Use this method when you have prepared JSON files with tenant data.

### Step 1: Prepare Sync Data

Create the following directory structure:

```
cmsftiaxesite/
  sync-data/
    <tenantCode>/
      site.json          # Tenant information
      header.json         # Header configuration
      footer.json         # Footer configuration
      menu.json           # Navigation menu
      pages/              # Page files
        homepage.json
        about.json
        contact.json
        ...
```

### Step 2: Prepare Assets (Optional)

If you have images/assets for the tenant:

```
cmsftiaxesite/
  public/
    sync-assets/
      <tenantCode>/
        images/
          logo.png
          hero.jpg
          ...
```

**Note:** Assets can also be placed in `public/` root and referenced with paths like `/images/logo.png`.

### Step 3: Create `site.json`

```json
{
  "tenant": "<tenantCode>",
  "projectName": "Your Project Name",
  "domains": ["example.com", "www.example.com"]
}
```

### Step 4: Create Page Files

Each page in `pages/` should follow this structure:

```json
{
  "title": "Page Title",
  "slug": "page-slug",
  "blocks": [
    {
      "type": "hero",
      "blockLabel": "Hero",
      "title": "Hero Title",
      "subtitle": "Hero Subtitle",
      "image": "/images/hero.jpg",
      "buttonLabel": "Click Me",
      "buttonLink": "/about"
    }
  ],
  "seo": {
    "title": "SEO Title",
    "description": "SEO Description"
  }
}
```

**Note:** The `blockLabel` field is optional. If not provided, it will be automatically set based on the block type:
- `hero` → "Hero"
- `imageGallery` → "Gallery"
- `richText` → "Content"

### Step 5: Run Sync Script

```bash
cd cmsftiaxesite
pnpm sync:site --tenant <tenantCode>
```

**Example:**
```bash
pnpm sync:site --tenant kalitechnia
```

### What the Sync Script Does

1. ✅ Creates/updates tenant in database
2. ✅ Creates/updates pages from `pages/` directory
3. ✅ Creates/updates navigation menu from `menu.json`
4. ✅ Creates/updates header from `header.json`
5. ✅ Creates/updates footer from `footer.json`
6. ✅ Creates/updates homepage from `pages/homepage.json`
7. ✅ Uploads media files referenced in blocks

---

## Method 2: Import from Frontend Project

Use this method to import content directly from an existing Next.js frontend project.

### Step 1: Locate Frontend Project

Ensure your frontend project is accessible. It should be:
- A Next.js project
- In a sibling directory or provide absolute path
- Contains pages, components, and assets

### Step 2: Run Import Script

```bash
cd cmsftiaxesite
pnpm import:frontend --tenant <tenantCode> --path <frontendPath>
```

**Examples:**

Relative path (sibling directory):
```bash
pnpm import:frontend --tenant kalitechnia --path ..\kalitechnia
```

Absolute path:
```bash
pnpm import:frontend --tenant kalitechnia --path C:\path\to\kalitechnia
```

### What the Import Script Does

1. ✅ Creates/updates tenant in database
2. ✅ Scans frontend project for pages (from `app/` or `pages/` directory)
3. ✅ Extracts page content and converts to Payload blocks
4. ✅ **Automatically detects frontend component names** (Hero, Features, Process, Contact, Footer, etc.) and sets section names (`blockLabel`)
5. ✅ Uploads images from `public/` directory
6. ✅ Creates navigation menu from detected routes
7. ✅ Creates header and footer (if found)
8. ✅ Creates homepage entry

**Section Name Detection:**
The import script automatically detects component names from your frontend code (e.g., `<Hero />`, `<Features />`, `<Process />`) and sets the `blockLabel` field accordingly. This makes it easier to identify sections in the CMS admin panel.

**Supported Block Types:**
- **Hero Block**: Hero sections with title, subtitle, background image, and CTA
- **Image + Text Block**: Sections with image and text side-by-side (left/right positioning)
- **Card Grid Block**: Grid sections with multiple cards (each card has image, title, description, button)
- **Programs Block**: Complete program sections with schedule tables and coach information
- **Sponsors Block**: Sponsor sections with logos, titles, and URLs
- **Image Gallery Block**: Multiple images in a gallery format
- **Rich Text Block**: General content sections with formatted text

**Special Page Handling:**
- **Programs Page**: Automatically detects `const programs = [...]` arrays and extracts all program data including schedules and coach information

**Frontend Structure Recommendations:**
For best import results, structure your frontend with:
- Named components (Hero, Features, Programs, etc.)
- Section comments: `{/* Section Title */}`
- Card IDs in data structures: `{ id: 1, title: "...", ... }`
- Consistent card structure (title, image, description, button)

See `FRONTEND_STRUCTURE_GUIDE.md` for detailed guidelines on structuring frontend components for optimal CMS import.

---

## Tenant Code Naming Convention

- Use lowercase letters and numbers only
- Use hyphens for separation if needed
- **Important:** The tenant code must match:
  - Frontend folder name (if using import script)
  - Sync data folder name (if using sync script)
  - Asset folder name (if using tenant-specific assets)

**Examples:**
- `kalitechnia` ✅
- `my-tenant` ✅
- `tenant123` ✅
- `MyTenant` ❌ (use lowercase)
- `tenant_code` ❌ (use hyphens, not underscores)

---

## Troubleshooting

### Error: "slug: This field is required"

**Solution:** Ensure all page JSON files have a `slug` field, or the script will auto-generate from title.

### Error: "Frontend site not found"

**Solution:** 
- Check the path is correct
- Use absolute path if relative path doesn't work
- Ensure the frontend project exists at that location

### Error: "Media file not found"

**Solution:**
- Check asset paths in your JSON files
- Ensure images exist in:
  - `public/sync-assets/<tenantCode>/` (tenant-specific)
  - `public/` (root public directory)

### Error: "Failed to connect to Payload CMS"

**Solution:**
- Check `.env` file exists and has `PAYLOAD_SECRET` and `DATABASE_URI`
- Ensure database is accessible
- Verify Payload config is correct

---

## Quick Reference

### Sync Script
```bash
# Basic usage
pnpm sync:site --tenant <tenantCode>

# Example
pnpm sync:site --tenant kalitechnia
```

### Import Script
```bash
# Basic usage
pnpm import:frontend --tenant <tenantCode> --path <frontendPath>

# Example (relative path)
pnpm import:frontend --tenant kalitechnia --path ..\kalitechnia

# Example (absolute path)
pnpm import:frontend --tenant kalitechnia --path C:\projects\kalitechnia
```

---

## File Structure Reference

### Sync Data Structure
```
sync-data/
  <tenantCode>/
    site.json          # Required: Tenant info
    header.json        # Required: Header config
    footer.json        # Required: Footer config
    menu.json          # Required: Navigation menu
    pages/             # Required: Page files
      homepage.json    # Required: Homepage
      about.json       # Optional: Other pages
      contact.json     # Optional: Other pages
      ...
```

### Asset Structure
```
public/
  sync-assets/        # Optional: Tenant-specific assets
    <tenantCode>/
      images/
        logo.png
        hero.jpg
        ...
  images/             # Optional: Shared assets
    ...
```

---

## Notes

- **Slug Generation:** If a slug is not provided in page JSON, it will be auto-generated from the title (lowercase, hyphens for spaces)
- **Media Upload:** Images referenced in blocks are automatically uploaded to Payload Media collection
- **Tenant Isolation:** All content is scoped to the tenant - pages, menus, headers, footers are tenant-specific
- **Idempotent Operations:** Both scripts are idempotent - running them multiple times will update existing records instead of creating duplicates

---

## Support

For issues or questions:
1. Check the error messages in the console output
2. Verify all prerequisites are met
3. Ensure file paths and tenant codes are correct
4. Check that JSON files are valid

