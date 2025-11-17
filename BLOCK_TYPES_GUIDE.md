# Block Types Guide

This guide explains all available block types in the Payload CMS system and how they're used.

## Available Block Types

### 1. Hero Block
**Slug:** `hero`

Hero sections for landing pages.

**Fields:**
- `blockLabel` - Section name (e.g., "Hero")
- `title` - Main headline
- `subtitle` - Supporting text
- `backgroundImage` - Hero background image
- `ctaLabel` - Call-to-action button text
- `ctaUrl` - Call-to-action button URL

**Use Case:** Main hero sections at the top of pages.

---

### 2. Image + Text Block
**Slug:** `imageText`

Sections with an image and text content side-by-side.

**Fields:**
- `blockLabel` - Section name (e.g., "About", "Welcome")
- `title` - Section title
- `subtitle` - Section subtitle
- `image` - Image to display
- `imagePosition` - Image position: "left" or "right"
- `content` - Rich text content

**Use Case:** About sections, feature highlights, content with images.

---

### 3. Card Grid Block
**Slug:** `cardGrid`

Grid sections with multiple cards (e.g., programs, services, features).

**Fields:**
- `blockLabel` - Section name (e.g., "Programs", "Services")
- `title` - Section title
- `subtitle` - Section subtitle
- `cards` - Array of cards, each with:
  - `image` - Card image
  - `title` - Card title
  - `description` - Card description
  - `buttonLabel` - Button text
  - `buttonUrl` - Button URL

**Use Case:** Program listings, service grids, feature showcases.

---

### 4. Programs Block
**Slug:** `programs`

Complete program sections with detailed information, schedules, and coach details.

**Fields:**
- `blockLabel` - Section name (e.g., "Programs", "Τμήματα")
- `title` - Section title
- `subtitle` - Section subtitle
- `programs` - Array of programs, each with:
  - `title` - Program title
  - `image` - Program image
  - `description` - Program description
  - `additionalInfo` - Additional information (optional)
  - `imagePosition` - Image position: "left" or "right"
  - `schedule` - Array of schedule items:
    - `day` - Day of week
    - `time` - Time range
    - `level` - Level/group
  - `coach` - Coach information:
    - `name` - Coach name
    - `photo` - Coach photo
    - `studies` - Qualifications
    - `bio` - Coach bio
    - `imagePosition` - Photo position: "left" or "right"

**Use Case:** Detailed program pages with schedules and coach information.

**Note:** This block is automatically detected when importing from `app/programs/page.tsx` files.

---

### 5. Sponsors Block
**Slug:** `sponsors`

Sponsor/partner sections with logos and links.

**Fields:**
- `blockLabel` - Section name (e.g., "Sponsors", "Partners")
- `title` - Section title
- `subtitle` - Section subtitle
- `sponsors` - Array of sponsors, each with:
  - `image` - Sponsor logo
  - `title` - Sponsor name
  - `url` - Sponsor website URL

**Use Case:** Sponsor/partner showcases.

---

### 6. Image Gallery Block
**Slug:** `imageGallery`

Multiple images displayed in a gallery format.

**Fields:**
- `blockLabel` - Section name (e.g., "Gallery", "Photos")
- `images` - Array of images, each with:
  - `image` - Image file
  - `caption` - Image caption

**Use Case:** Photo galleries, image showcases.

---

### 7. Rich Text Block
**Slug:** `richText`

General content sections with formatted text.

**Fields:**
- `blockLabel` - Section name (e.g., "Content", "About")
- `content` - Rich text content (Lexical editor)

**Use Case:** General content sections, articles, descriptions.

---

## Automatic Detection

The import script automatically detects and creates appropriate block types based on frontend content:

- **Hero sections**: Detected from `<Hero />` components or sections with `<h1>` tags
- **Image + Text**: Detected from 2-column grids with image and text
- **Card Grids**: Detected from multiple `<Card />` components or grid structures
- **Programs**: Detected from `const programs = [...]` arrays in programs pages
- **Sponsors**: Detected from sections with "sponsors" or "χορηγοί" keywords
- **Image Galleries**: Detected from sections with 3+ images
- **Rich Text**: Default fallback for text content

## Section Titles

Section titles are automatically extracted from:
1. Comments before sections: `{/* Section Title */}`
2. `<h2>` tags within sections
3. Component names detected from frontend code

## Best Practices

1. **Use descriptive `blockLabel` values** - Makes it easier to identify sections in CMS admin
2. **Keep block types consistent** - Use the same block type for similar content structures
3. **Organize programs** - Use Programs Block for detailed program pages with schedules
4. **Use Card Grid** - For simple listings without schedules/coaches
5. **Image positioning** - Set `imagePosition` to control layout (left/right)

