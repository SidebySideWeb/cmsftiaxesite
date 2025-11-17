# Content Structure Guide

This guide explains how the CMS import system identifies and structures content hierarchically.

## Content Hierarchy

The import system recognizes the following hierarchical structure:

```
Section (Top Level)
├── Subsection (h2/h3 headings)
│   ├── Card (with ID if exists)
│   │   ├── Title
│   │   ├── Image
│   │   ├── Description
│   │   └── Button/Link
│   └── Card (with ID if exists)
│       └── ...
└── Subsection
    └── ...
```

## Structure Detection

### 1. Sections
**Detection:**
- `<section>` HTML tags
- Component boundaries (e.g., `<Hero />`, `<Features />`)
- Major content divisions

**Extraction:**
- Section title from comments: `{/* Section Title */}`
- Section title from `<h2>` tags
- Component names from frontend code

### 2. Subsections
**Detection:**
- Multiple `<h2>` or `<h3>` headings within a section
- Nested div structures with subsection classes
- Content grouped by headings

**Extraction:**
- Subsection titles from headings
- Content between headings
- Images and text within each subsection

### 3. Cards (with IDs)
**Detection:**
- Cards with IDs: `id: 1`, `id: 2`, etc. (from data structures)
- Multiple `<Card />` components
- Grid structures with card-like patterns
- Array mappings: `programs.map()`, `cards.map()`

**Card Structure:**
- **ID**: Extracted from data structures (e.g., `id: 1`)
- **Title**: From `<h3>` tags or data fields
- **Image**: From `<Image />` components
- **Description**: From `<p>` tags (excluding button text)
- **Button**: From `<Button><Link>` or `<Link>` components

## Examples

### Example 1: Programs Page
```javascript
const programs = [
  {
    id: 1,  // ← Card ID detected
    title: "Program Title",  // ← Card Title
    image: "...",  // ← Card Image
    description: "...",  // ← Card Description
    schedule: [...],  // ← Additional data
    coach: {...}  // ← Additional data
  }
]
```

**Result:** Programs Block with each program as a card (with ID)

### Example 2: Card Grid Section
```jsx
<section>
  <h2>Τα Τμήματά μας</h2>  {/* ← Section Title */}
  <div className="grid">
    <Card>  {/* ← Card 1 */}
      <Image src="..." />
      <h3>Card Title</h3>
      <p>Description</p>
      <Button><Link>...</Link></Button>
    </Card>
    <Card>  {/* ← Card 2 */}
      ...
    </Card>
  </div>
</section>
```

**Result:** Card Grid Block with:
- Section title: "Τα Τμήματά μας"
- Multiple cards (each with title, image, description, button)

### Example 3: Section with Subsections
```jsx
<section>
  <h2>Main Section</h2>  {/* ← Section Title */}
  
  <h3>Subsection 1</h3>  {/* ← Subsection */}
  <p>Content...</p>
  
  <h3>Subsection 2</h3>  {/* ← Subsection */}
  <p>Content...</p>
</section>
```

**Result:** Section block with subsections identified

## Block Types by Structure

| Structure | Block Type | Notes |
|-----------|------------|-------|
| Section with cards (2+) | `cardGrid` | Cards extracted as array items |
| Section with cards + IDs | `cardGrid` | IDs preserved in card data |
| Programs array | `programs` | Special handling for programs page |
| Section + Image + Text | `imageText` | 2-column grid detected |
| Section with 3+ images | `imageGallery` | Gallery format |
| Section with sponsors | `sponsors` | Keyword detection |
| Section with subsections | `richText` or `cardGrid` | Based on content type |

## ID Detection

Cards with IDs are detected from:
1. **Data structures**: `id: 1`, `id: 2` in arrays
2. **Array indices**: When cards are in `.map()` functions
3. **Card order**: Sequential numbering if no ID found

IDs help:
- Identify specific cards for editing
- Maintain relationships between frontend and CMS
- Enable programmatic card management

## Best Practices

1. **Use IDs in data structures** - Makes cards easier to identify
2. **Consistent section structure** - Use similar patterns for similar content
3. **Clear subsection headings** - Helps with hierarchical detection
4. **Descriptive section titles** - Use comments or h2 tags
5. **Card structure consistency** - Same fields across cards in a grid

## Import Process

1. **Page Analysis**: Scans page structure
2. **Section Detection**: Identifies top-level sections
3. **Subsection Extraction**: Finds subsections within sections
4. **Card Identification**: Detects cards with IDs and structure
5. **Content Extraction**: Pulls title, image, description, etc.
6. **Block Creation**: Creates appropriate block types
7. **Image Upload**: Uploads referenced images to media library

## Result

After import, you'll have:
- ✅ Structured blocks matching your frontend hierarchy
- ✅ Cards with IDs preserved (if they existed)
- ✅ Subsections identified and organized
- ✅ All images uploaded and linked
- ✅ Content ready for CMS editing

