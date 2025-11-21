# V0 → Payload Block Mapping Engine

A comprehensive system for automatically analyzing V0 React components and generating Payload CMS block schemas, sync JSON templates, and frontend rendering metadata.

## Features

- **Automatic Pattern Detection**: Detects 20+ component patterns (Hero, Gallery, Grid, Forms, etc.)
- **Animation Detection**: Identifies Framer Motion, GSAP, CSS animations, and scroll-based reveals
- **Responsive Detection**: Extracts Tailwind responsive classes and conditional rendering
- **Payload Schema Generation**: Creates complete Payload block schemas with proper field types
- **Sync JSON Generation**: Generates templates for importing components into Payload
- **Versioning System**: Tracks schema changes and maintains version history
- **Block Registry**: Centralized registry of all analyzed blocks

## Installation

Add required dependencies:

```bash
pnpm add -D @babel/parser @babel/traverse @babel/types
```

## Usage

### CLI

```bash
# Analyze a single component
tsx src/scripts/v0-analyzer/cli.ts --input ./components/Hero.tsx --output ./generated-blocks --tenant kalitechnia

# Analyze a directory
tsx src/scripts/v0-analyzer/cli.ts --input ./components --output ./generated-blocks --tenant kalitechnia --verbose

# With custom registry
tsx src/scripts/v0-analyzer/cli.ts -i ./components -o ./blocks -t mytenant -r ./my-registry.json
```

### Programmatic API

```typescript
import { analyzeComponent, BlockRegistry } from './v0-analyzer'

// Analyze a component
const result = await analyzeComponent('./components/Hero.tsx')

// Access results
console.log(result.detectedPattern.type) // 'hero'
console.log(result.payloadSchema) // Payload block schema
console.log(result.syncJsonTemplate) // Sync JSON template

// Register block
const registry = new BlockRegistry('./block-registry.json')
registry.register(result.mapping, './schemas/hero.ts')
```

## Detected Patterns

The engine detects the following component patterns:

1. **Hero Section** - Full-width banners with title, subtitle, CTA buttons
2. **Image Gallery** - Grids of images with captions
3. **Rich Text** - Content sections with HTML/rich text
4. **Image + Text** - Two-column layouts with image and text
5. **Card Grid** - Repeated card components in a grid
6. **Feature List** - Lists of features with icons
7. **FAQ / Accordion** - Expandable Q&A sections
8. **Tabs** - Tabbed content sections
9. **Video Block** - Video embeds (YouTube, Vimeo)
10. **Slider / Carousel** - Image/content sliders
11. **CTA Banner** - Call-to-action sections
12. **Testimonials** - Customer testimonials with avatars
13. **Logo Cloud** - Rows of sponsor/client logos
14. **Pricing Table** - Pricing plans comparison
15. **Contact Form** - Form components with fields
16. **Map Block** - Google Maps embeds
17. **Navigation** - Menu/navigation components
18. **Footer** - Footer sections with columns
19. **Grid Layout** - Generic grid layouts
20. **Raw HTML** - Raw HTML content blocks

## Animation Detection

The engine detects:

- **Framer Motion**: `motion.div`, `initial`, `animate`, `whileInView`
- **GSAP**: `gsap.to`, `gsap.from`, `ScrollTrigger`
- **CSS/Tailwind**: `transition`, `duration-`, `animate-`, `hover:`
- **Scroll Reveal**: `useInView`, `IntersectionObserver`, scroll-based animations

## Responsive Detection

The engine extracts:

- **Tailwind Breakpoints**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` classes
- **Grid Columns**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Flex Direction**: `flex-col md:flex-row`
- **Conditional Rendering**: `isMobile ? <Mobile /> : <Desktop />`

## Output Structure

```
generated-blocks/
├── kalitechnia/
│   ├── schemas/
│   │   ├── hero.ts
│   │   ├── imageGallery.ts
│   │   └── ...
│   └── sync-json/
│       ├── Hero.tsx.json
│       ├── ImageGallery.tsx.json
│       └── ...
└── block-registry.json
```

## Payload Block Schema

Generated schemas include:

- Proper field types (text, richText, upload, array, etc.)
- Field validation and requirements
- Admin UI descriptions
- Animation configuration (if detected)
- Scroll reveal settings (if detected)
- Layout configuration (if responsive)

## Sync JSON Template

Generated sync JSON includes:

- Block type and label
- All field values from component props
- Default values for optional fields
- Array structures for repeated content

## Versioning

The registry system:

- Tracks schema versions
- Detects schema changes
- Creates versioned schema files (`hero.v2.ts`)
- Maintains changelog

## Integration with syncSite

The generated sync JSON can be used with `syncSite.js`:

```javascript
import { syncJsonTemplate } from './generated-blocks/kalitechnia/sync-json/Hero.tsx.json'

// Use in syncSite.js
await upsertBlock(page, syncJsonTemplate)
```

## Advanced Usage

### Custom Pattern Detection

```typescript
import { detectPattern } from './v0-analyzer'

const customPattern = detectPattern(componentNode)
// Returns DetectedPattern with confidence score
```

### Animation Detection

```typescript
import { detectFramerMotion, detectGSAP, detectCSSAnimations } from './v0-analyzer'

const animation = detectFramerMotion(jsx, imports) ||
                  detectGSAP(jsx, imports) ||
                  detectCSSAnimations(jsx)
```

### Responsive Detection

```typescript
import { extractTailwindResponsive, detectConditionalRendering } from './v0-analyzer'

const layout = extractTailwindResponsive(jsx)
const conditional = detectConditionalRendering(jsx, imports)
```

## Limitations

- Requires Babel parser for JSX/TypeScript
- Some complex component patterns may require manual adjustment
- Animation config extraction is best-effort (may need manual refinement)
- Responsive detection works best with Tailwind classes

## Contributing

To add new pattern detectors:

1. Add detection function to `patternDetectors.ts`
2. Add field generation to `payloadGenerator.ts`
3. Add sync JSON generation to `syncJsonGenerator.ts`
4. Update this README

## License

MIT

