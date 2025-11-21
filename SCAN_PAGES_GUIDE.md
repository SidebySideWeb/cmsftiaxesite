# Scan All Pages Script Guide

## Overview

The `scanAllPages` script automatically scans all frontend pages in a tenant project and populates the CMS with appropriate blocks and content extracted from the page files.

## Usage

```bash
cd cmsftiaxesite
pnpm scan:pages --tenant <tenantCode> --path <frontendPath>
```

### Example

```bash
pnpm scan:pages --tenant kalitechnia --path ..\kalitechnia
```

## What It Does

1. **Scans All Pages**: Recursively finds all `page.tsx` files in the `app` directory
2. **Extracts Content**: Parses each page file to extract:
   - Hero sections (title, image, button)
   - Welcome sections (image, title, content)
   - Programs sections (cards with images, titles, descriptions)
   - Moments/Gallery sections (images with captions)
   - Sponsors sections
   - CTA banners
   - Programs page sections (with timetables and coach info)
   - Contact details sections
   - Generic content sections

3. **Uploads Images**: 
   - Downloads external URLs (Vercel blob storage, etc.)
   - Uploads local images
   - Checks for existing images to avoid duplicates

4. **Creates CMS Pages**: Creates or updates pages in Payload CMS with extracted blocks

## Page Type Detection

The script automatically detects page types and extracts appropriate blocks:

- **Homepage** (`page.tsx` or `homepage`): Extracts hero, welcome, programs, moments, sponsors, CTA
- **Programs Page** (`programs/page.tsx`): Extracts program sections with timetables and coach info
- **Registration Page** (`registration/page.tsx`): Extracts contact details blocks
- **Other Pages**: Generic extraction of all sections

## Supported Block Types

- `hero` - Hero sections with background image
- `imageText` - Image and text sections (Welcome)
- `cardGrid` - Card grid sections (Programs)
- `imageGallery` - Image gallery (Moments)
- `sponsors` - Sponsors section
- `ctaBanner` - Call-to-action banners
- `programs` - Full program sections with timetable and coach
- `contactDetails` - Contact information cards
- `richText` - Generic rich text content

## Image Handling

- **External URLs**: Automatically downloaded and uploaded to CMS
- **Local Files**: Found and uploaded from public directory
- **Duplicates**: Checks existing media to avoid re-uploading

## Notes

- Dynamic routes (`[slug]`) are skipped
- Images from external URLs are temporarily downloaded, uploaded, then deleted
- The script preserves existing pages and updates them if they already exist
- All blocks are mapped using the standardized block structure

## Output

The script provides detailed logging:
- Pages found and processed
- Images uploaded
- Blocks extracted
- Any errors or warnings

## Troubleshooting

- **Images not found**: Check that image URLs are accessible or files exist in public directory
- **Blocks not extracted**: Verify page structure matches expected patterns
- **Upload errors**: Check Payload CMS connection and permissions

