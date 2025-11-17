# Frontend Structure Guide for CMS Import

This guide explains how to structure your frontend pages and components to ensure optimal content extraction by the CMS import system.

## Why Component-Based Structure Helps

When you structure your frontend with clear components, the import script can:
- ✅ Automatically detect section types
- ✅ Extract content more accurately
- ✅ Preserve hierarchical relationships
- ✅ Set proper section names (`blockLabel`)
- ✅ Identify cards with IDs

## Recommended Structure

### Page Structure

```tsx
// app/page.tsx or app/[slug]/page.tsx
import Hero from "@/components/Hero"
import Features from "@/components/Features"
import Programs from "@/components/Programs"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"

export default function Page() {
  return (
    <main>
      {/* Hero Section */}
      <Hero data={heroData} />
      
      {/* Features Section */}
      <Features data={featuresData} />
      
      {/* Programs Section */}
      <Programs data={programsData} />
      
      {/* Contact Section */}
      <Contact data={contactData} />
      
      <Footer data={footerData} />
    </main>
  )
}
```

### Component Structure

#### 1. Hero Component
```tsx
// components/Hero.tsx
export default function Hero({ data }: { data: HeroData }) {
  return (
    <section className="hero-section">
      <h1>{data.title}</h1>
      <p>{data.subtitle}</p>
      <Image src={data.image} alt={data.title} />
      <Button href={data.ctaUrl}>{data.ctaLabel}</Button>
    </section>
  )
}
```

**Detection:** Automatically detected as "Hero" block

---

#### 2. Features/Card Grid Component
```tsx
// components/Features.tsx
export default function Features({ data }: { data: FeaturesData }) {
  return (
    <section className="features-section">
      {/* Section Title */}
      <h2>{data.title}</h2>
      <p className="text-center">{data.subtitle}</p>
      
      {/* Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {data.items.map((item, index) => (
          <Card key={item.id || index}>
            <Image src={item.image} alt={item.title} />
            <CardContent>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Button asChild>
                <Link href={item.url}>{item.buttonLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
```

**Detection:** Automatically detected as "Card Grid" block with cards

**Best Practice:** Include `id` in card data:
```tsx
const featuresData = {
  title: "Features",
  items: [
    { id: 1, title: "Feature 1", ... },
    { id: 2, title: "Feature 2", ... },
  ]
}
```

---

#### 3. Image + Text Component
```tsx
// components/About.tsx
export default function About({ data }: { data: AboutData }) {
  return (
    <section className="about-section">
      {/* Καλωσόρισμα από την Ιδρύτρια */}
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <Image src={data.image} alt={data.title} />
        </div>
        <div>
          <h2>{data.title}</h2>
          <p>{data.description}</p>
        </div>
      </div>
    </section>
  )
}
```

**Detection:** Automatically detected as "Image & Text" block

**Best Practice:** Use comment for section title:
```tsx
{/* Section Title */}
<section>...</section>
```

---

#### 4. Programs Component (with IDs)
```tsx
// components/Programs.tsx or app/programs/page.tsx
export default function ProgramsPage() {
  const programs = [
    {
      id: 1,  // ← Important: Include ID
      title: "Program 1",
      image: "...",
      description: "...",
      schedule: [...],
      coach: {...}
    },
    {
      id: 2,  // ← Each program has unique ID
      title: "Program 2",
      ...
    }
  ]

  return (
    <main>
      <section className="hero">
        <h1>Programs</h1>
        <p>Subtitle</p>
      </section>
      
      {programs.map((program) => (
        <section key={program.id}>
          <h2>{program.title}</h2>
          {/* Program content */}
        </section>
      ))}
    </main>
  )
}
```

**Detection:** Automatically detected as "Programs" block

---

## Component Naming Conventions

### Component Names → Block Labels

| Component Name | Detected Block Label |
|----------------|---------------------|
| `<Hero />` | "Hero" |
| `<Features />` | "Features" |
| `<Programs />` | "Programs" |
| `<About />` | "About" |
| `<Services />` | "Services" |
| `<Contact />` | "Contact" |
| `<Footer />` | "Footer" |
| `<Process />` | "Process" |
| `<Testimonials />` | "Testimonials" |
| `<Gallery />` | "Gallery" |

### Section Comments

Use comments to set section titles:
```tsx
{/* Καλωσόρισμα από την Ιδρύτρια */}
<section>...</section>

{/* Τα Τμήματά μας */}
<section>...</section>
```

---

## Data Structure Best Practices

### 1. Use Arrays with IDs
```tsx
// ✅ Good: Cards with IDs
const programs = [
  { id: 1, title: "...", ... },
  { id: 2, title: "...", ... },
]

// ✅ Good: Cards without IDs (will get auto-numbered)
const features = [
  { title: "...", ... },
  { title: "...", ... },
]
```

### 2. Consistent Card Structure
```tsx
// ✅ Good: Consistent structure
interface Card {
  id?: number
  title: string
  image: string
  description: string
  buttonLabel?: string
  buttonUrl?: string
}
```

### 3. Section Titles
```tsx
// ✅ Good: Use h2 for section titles
<section>
  <h2>Section Title</h2>
  <p className="text-center">Subtitle</p>
  {/* Content */}
</section>

// ✅ Good: Use comments
{/* Section Title */}
<section>
  {/* Content */}
</section>
```

---

## v0.app Structure Recommendations

When building pages with v0.app, structure them like this:

### Template Structure
```tsx
export default function Page() {
  return (
    <main>
      {/* Hero Section */}
      <Hero />
      
      {/* Main Content Section */}
      <section>
        {/* Section Title */}
        <h2>Section Title</h2>
        
        {/* Cards Grid */}
        <div className="grid md:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              {/* Card content */}
            </Card>
          ))}
        </div>
      </section>
      
      {/* Another Section */}
      <section>
        {/* Content */}
      </section>
    </main>
  )
}
```

### Component Checklist for v0.app

When asking v0.app to build components, include:

1. **Component Names**: Use descriptive names (Hero, Features, Programs, etc.)
2. **Section Comments**: Add comments for section titles
3. **Card IDs**: Include `id` field in card data structures
4. **Consistent Structure**: Same fields across cards (title, image, description)
5. **h2 Tags**: Use `<h2>` for section titles
6. **Card Components**: Use `<Card>` components for card grids

### Example v0.app Prompt

```
Build a landing page with:
- Hero section component with title, subtitle, image, and CTA button
- Features section component with a grid of cards (each card has id, title, image, description, button)
- Programs section component with programs array (each program has id, title, image, description, schedule table, coach info)
- Use section comments for titles like {/* Section Title */}
- Use h2 tags for section headings
- Structure cards consistently with title, image, description, button
```

---

## Detection Rules

### Automatic Detection

The import script automatically detects:

1. **Hero Sections**:
   - `<Hero />` component
   - Sections with `<h1>` tags

2. **Card Grids**:
   - Multiple `<Card />` components (2+)
   - Grids with card-like structure
   - Arrays with `.map()` and Card components

3. **Image + Text**:
   - 2-column grids (`md:grid-cols-2`)
   - Image + text side-by-side

4. **Programs**:
   - `const programs = [...]` arrays
   - Programs with `id`, `schedule`, `coach` fields

5. **Sponsors**:
   - Sections with "sponsors" or "χορηγοί" keywords
   - Grids with sponsor logos

### Manual Override

If automatic detection doesn't work, you can:
- Use specific component names (Hero, Features, etc.)
- Add section comments: `{/* Section Name */}`
- Use consistent class names: `className="hero-section"`

---

## Benefits of This Structure

✅ **Automatic Detection**: Components are automatically identified  
✅ **Proper Labels**: Section names are set correctly  
✅ **ID Preservation**: Card IDs are maintained  
✅ **Hierarchical Structure**: Sections → Subsections → Cards  
✅ **Easy Management**: Add/remove entire blocks in CMS  
✅ **Consistent Structure**: Same patterns work across pages  

---

## Quick Reference

### For v0.app Prompts

```
Create a [ComponentName] component with:
- Section wrapper with comment: {/* Component Name */}
- h2 tag for section title
- Consistent card structure (id, title, image, description, button)
- Use Card components from shadcn/ui
- Grid layout for multiple items
```

### Component Template

```tsx
export default function ComponentName({ data }) {
  return (
    <section>
      {/* Component Name */}
      <h2>{data.title}</h2>
      <p>{data.subtitle}</p>
      
      <div className="grid md:grid-cols-3">
        {data.items.map((item) => (
          <Card key={item.id}>
            <Image src={item.image} />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Button><Link href={item.url}>{item.buttonLabel}</Link></Button>
          </Card>
        ))}
      </div>
    </section>
  )
}
```

---

## Summary

**Yes, structuring frontend with components helps!**

When you:
1. Use component names (Hero, Features, Programs, etc.)
2. Include IDs in card data structures
3. Use section comments for titles
4. Structure cards consistently

The import system will:
- ✅ Detect content types automatically
- ✅ Extract structure correctly
- ✅ Preserve IDs and relationships
- ✅ Create manageable CMS blocks

**Recommendation**: When using v0.app, ask it to structure pages with named components and include IDs in data structures for best results!

