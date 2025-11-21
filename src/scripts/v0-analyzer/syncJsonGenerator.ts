/**
 * Sync JSON Generator
 * Creates JSON templates for syncSite.js to import V0 components into Payload
 */

import type {
  DetectedPattern,
  SyncJsonBlock,
  PayloadBlockSchema,
} from './types'

/**
 * Generate sync JSON template from detected pattern and Payload schema
 */
export function generateSyncJson(
  pattern: DetectedPattern,
  schema: PayloadBlockSchema,
  componentName: string
): SyncJsonBlock {
  const block: SyncJsonBlock = {
    blockType: pattern.type,
    blockLabel: `${componentName} Block`,
  }

  // Generate fields based on pattern type
  switch (pattern.type) {
    case 'hero':
      return generateHeroSyncJson(pattern, block)
    case 'imageGallery':
      return generateImageGallerySyncJson(pattern, block)
    case 'richText':
      return generateRichTextSyncJson(pattern, block)
    case 'imageText':
      return generateImageTextSyncJson(pattern, block)
    case 'cardGrid':
      return generateCardGridSyncJson(pattern, block)
    case 'featureList':
      return generateFeatureListSyncJson(pattern, block)
    case 'faq':
      return generateFAQSyncJson(pattern, block)
    case 'tabs':
      return generateTabsSyncJson(pattern, block)
    case 'video':
      return generateVideoSyncJson(pattern, block)
    case 'slider':
      return generateSliderSyncJson(pattern, block)
    case 'ctaBanner':
      return generateCTABannerSyncJson(pattern, block)
    case 'testimonials':
      return generateTestimonialsSyncJson(pattern, block)
    case 'logoCloud':
      return generateLogoCloudSyncJson(pattern, block)
    case 'pricingTable':
      return generatePricingTableSyncJson(pattern, block)
    case 'contactForm':
      return generateContactFormSyncJson(pattern, block)
    case 'map':
      return generateMapSyncJson(pattern, block)
    case 'navigation':
      return generateNavigationSyncJson(pattern, block)
    case 'footer':
      return generateFooterSyncJson(pattern, block)
    case 'gridLayout':
      return generateGridLayoutSyncJson(pattern, block)
    case 'rawHtml':
      return generateRawHtmlSyncJson(pattern, block)
    default:
      return generateGenericSyncJson(pattern, block)
  }
}

/**
 * Generate Hero sync JSON
 */
function generateHeroSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.content = pattern.props.content?.defaultValue || pattern.props.subtitle?.defaultValue || null
  block.backgroundImage = pattern.props.backgroundImage?.defaultValue || null
  block.buttonLabel = pattern.props.buttonLabel?.defaultValue || pattern.props.ctaLabel?.defaultValue || ''
  block.buttonUrl = pattern.props.buttonUrl?.defaultValue || pattern.props.ctaUrl?.defaultValue || ''
  return block
}

/**
 * Generate Image Gallery sync JSON
 */
function generateImageGallerySyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.images = pattern.props.images?.defaultValue || []
  return block
}

/**
 * Generate Rich Text sync JSON
 */
function generateRichTextSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.content = pattern.props.content?.defaultValue || pattern.props.text?.defaultValue || ''
  return block
}

/**
 * Generate Image + Text sync JSON
 */
function generateImageTextSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.image = pattern.props.image?.defaultValue || null
  block.imagePosition = pattern.props.imagePosition?.defaultValue || 'left'
  block.title = pattern.props.title?.defaultValue || ''
  block.content = pattern.props.content?.defaultValue || pattern.props.text?.defaultValue || null
  block.buttonLabel = pattern.props.buttonLabel?.defaultValue || ''
  block.buttonUrl = pattern.props.buttonUrl?.defaultValue || ''
  return block
}

/**
 * Generate Card Grid sync JSON
 */
function generateCardGridSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.subtitle = pattern.props.subtitle?.defaultValue || ''
  block.cards = pattern.props.cards?.defaultValue || pattern.props.items?.defaultValue || []
  return block
}

/**
 * Generate Feature List sync JSON
 */
function generateFeatureListSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.features = pattern.props.features?.defaultValue || pattern.props.items?.defaultValue || []
  return block
}

/**
 * Generate FAQ sync JSON
 */
function generateFAQSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.items = pattern.props.items?.defaultValue || pattern.props.faqs?.defaultValue || []
  return block
}

/**
 * Generate Tabs sync JSON
 */
function generateTabsSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.tabs = pattern.props.tabs?.defaultValue || pattern.props.items?.defaultValue || []
  return block
}

/**
 * Generate Video sync JSON
 */
function generateVideoSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.videoUrl = pattern.props.videoUrl?.defaultValue || pattern.props.url?.defaultValue || ''
  block.thumbnail = pattern.props.thumbnail?.defaultValue || null
  block.title = pattern.props.title?.defaultValue || ''
  return block
}

/**
 * Generate Slider sync JSON
 */
function generateSliderSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.slides = pattern.props.slides?.defaultValue || pattern.props.items?.defaultValue || []
  return block
}

/**
 * Generate CTA Banner sync JSON
 */
function generateCTABannerSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.content = pattern.props.content?.defaultValue || pattern.props.description?.defaultValue || null
  block.buttonLabel = pattern.props.buttonLabel?.defaultValue || pattern.props.ctaLabel?.defaultValue || ''
  block.buttonUrl = pattern.props.buttonUrl?.defaultValue || pattern.props.ctaUrl?.defaultValue || ''
  block.backgroundGradient = pattern.props.backgroundGradient?.defaultValue || 'purple-orange'
  return block
}

/**
 * Generate Testimonials sync JSON
 */
function generateTestimonialsSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.testimonials = pattern.props.testimonials?.defaultValue || pattern.props.reviews?.defaultValue || []
  return block
}

/**
 * Generate Logo Cloud sync JSON
 */
function generateLogoCloudSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.logos = pattern.props.logos?.defaultValue || pattern.props.brands?.defaultValue || []
  return block
}

/**
 * Generate Pricing Table sync JSON
 */
function generatePricingTableSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.plans = pattern.props.plans?.defaultValue || pattern.props.prices?.defaultValue || []
  return block
}

/**
 * Generate Contact Form sync JSON
 */
function generateContactFormSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.title = pattern.props.title?.defaultValue || ''
  block.description = pattern.props.description?.defaultValue || null
  block.fields = pattern.props.fields?.defaultValue || []
  return block
}

/**
 * Generate Map sync JSON
 */
function generateMapSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.mapUrl = pattern.props.mapUrl?.defaultValue || pattern.props.url?.defaultValue || ''
  return block
}

/**
 * Generate Navigation sync JSON
 */
function generateNavigationSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.items = pattern.props.items?.defaultValue || pattern.props.links?.defaultValue || pattern.props.menu?.defaultValue || []
  return block
}

/**
 * Generate Footer sync JSON
 */
function generateFooterSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.columns = pattern.props.columns?.defaultValue || []
  block.socialLinks = pattern.props.socialLinks?.defaultValue || []
  return block
}

/**
 * Generate Grid Layout sync JSON
 */
function generateGridLayoutSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.items = pattern.props.items?.defaultValue || []
  return block
}

/**
 * Generate Raw HTML sync JSON
 */
function generateRawHtmlSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  block.html = pattern.props.html?.defaultValue || pattern.props.content?.defaultValue || ''
  return block
}

/**
 * Generate Generic sync JSON (fallback)
 */
function generateGenericSyncJson(pattern: DetectedPattern, block: SyncJsonBlock): SyncJsonBlock {
  // Copy all props as-is
  Object.entries(pattern.props).forEach(([key, prop]) => {
    if (prop.defaultValue !== undefined) {
      block[key] = prop.defaultValue
    }
  })

  // Add children as content if present
  if (pattern.children.length > 0) {
    block.content = extractChildrenContent(pattern.children)
  }

  return block
}

/**
 * Extract content from children components
 */
function extractChildrenContent(children: any[]): string {
  return children
    .map(child => {
      if (typeof child === 'string') return child
      if (child.jsx) return child.jsx
      if (child.children) return extractChildrenContent(child.children)
      return ''
    })
    .join('\n')
}

