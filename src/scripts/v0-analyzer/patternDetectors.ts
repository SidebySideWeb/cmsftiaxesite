/**
 * Pattern detection for V0 components
 * Detects all component types and extracts metadata
 */

import type {
  ComponentNode,
  DetectedPattern,
  PatternMetadata,
  BlockType,
  PropInfo,
} from './types'
import { extractPropInfo, containsHTML, isRichText, isImageUrl, isVideoUrl, isMapEmbed } from './typeInference'

/**
 * Main pattern detection function
 */
export function detectPattern(component: ComponentNode): DetectedPattern {
  const jsx = component.jsx.toLowerCase()
  const name = component.name.toLowerCase()

  // Try specific pattern detectors in order of specificity
  const detectors = [
    detectHero,
    detectContactForm,
    detectMap,
    detectVideo,
    detectFAQ,
    detectTabs,
    detectSlider,
    detectTestimonials,
    detectLogoCloud,
    detectPricingTable,
    detectImageGallery,
    detectCardGrid,
    detectFeatureList,
    detectCTABanner,
    detectImageText,
    detectRichText,
    detectNavigation,
    detectFooter,
    detectGridLayout,
    detectRawHtml,
  ]

  for (const detector of detectors) {
    const result = detector(component)
    if (result && result.confidence > 0.5) {
      return result
    }
  }

  // Fallback to generic content block
  return detectGenericContentBlock(component)
}

/**
 * Detect Hero Section
 */
function detectHero(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isHeroName = name.includes('hero') || name.includes('banner')
  const hasFullWidth = /w-full|full-width|min-h-\[600px\]|min-h-screen/i.test(jsx)
  const hasBackgroundImage = /backgroundImage|bg-\[url|style.*background/i.test(jsx)
  const hasLargeTitle = /text-[4-9]xl|text-5xl|text-6xl|text-7xl/i.test(jsx)
  const hasSubtitle = /subtitle|description/i.test(jsx) || /text-xl|text-2xl/i.test(jsx)
  const hasButtons = /button|cta|link.*href/i.test(jsx)

  const confidence =
    (isHeroName ? 0.3 : 0) +
    (hasFullWidth ? 0.2 : 0) +
    (hasBackgroundImage ? 0.2 : 0) +
    (hasLargeTitle ? 0.15 : 0) +
    (hasButtons ? 0.15 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasBackgroundImage: !!hasBackgroundImage,
    hasTitle: !!hasLargeTitle,
    hasSubtitle: !!hasSubtitle,
    hasButtons: !!hasButtons,
  }

  return {
    type: 'hero',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Image Gallery
 */
function detectImageGallery(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isGalleryName = name.includes('gallery') || name.includes('images')
  const hasImageArray = /images\s*:\s*\[|\.map\(.*image/i.test(jsx)
  const hasMultipleImages = (jsx.match(/<img|Image|image/gi) || []).length > 2
  const hasGrid = /grid|flex.*wrap/i.test(jsx)

  const confidence =
    (isGalleryName ? 0.4 : 0) +
    (hasImageArray ? 0.3 : 0) +
    (hasMultipleImages ? 0.2 : 0) +
    (hasGrid ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasImages: true,
    isRepeated: true,
    itemCount: (jsx.match(/<img|Image/gi) || []).length,
  }

  return {
    type: 'imageGallery',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Rich Text / Content Section
 */
function detectRichText(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isContentName = name.includes('content') || name.includes('text') || name.includes('section')
  const hasHTML = containsHTML(jsx) || /dangerouslySetInnerHTML|innerHTML/i.test(jsx)
  const hasParagraphs = /<p>|<h[1-6]>/i.test(jsx)
  const hasLists = /<ul>|<ol>|<li>/i.test(jsx)
  const hasRichTextProps = /content|text|description|body/i.test(Object.keys(component.props).join(' '))

  const confidence =
    (isContentName ? 0.2 : 0) +
    (hasHTML ? 0.3 : 0) +
    (hasParagraphs ? 0.2 : 0) +
    (hasLists ? 0.15 : 0) +
    (hasRichTextProps ? 0.15 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasText: true,
  }

  return {
    type: 'richText',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Image + Text Combo
 */
function detectImageText(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isImageTextName = name.includes('image') && name.includes('text')
  const hasImage = /<img|Image|image/i.test(jsx)
  const hasText = /<p>|<h[1-6]>/i.test(jsx) || /text|content/i.test(Object.keys(component.props).join(' '))
  const hasTwoColumnLayout = /grid-cols-2|md:grid-cols-2|flex.*gap/i.test(jsx)
  const hasImageProp = /image|img|photo/i.test(Object.keys(component.props).join(' '))

  const confidence =
    (isImageTextName ? 0.3 : 0) +
    (hasImage ? 0.25 : 0) +
    (hasText ? 0.25 : 0) +
    (hasTwoColumnLayout ? 0.1 : 0) +
    (hasImageProp ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasImages: true,
    hasText: true,
  }

  return {
    type: 'imageText',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Card Grid
 */
function detectCardGrid(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isGridName = name.includes('grid') || name.includes('card')
  const hasCardArray = /cards\s*:\s*\[|items\s*:\s*\[|\.map\(.*card/i.test(jsx)
  const hasGridLayout = /grid|grid-cols/i.test(jsx)
  const hasRepeatedCards = (jsx.match(/card|Card/gi) || []).length > 2
  const hasImageAndText = /image.*title|title.*image/i.test(jsx)

  const confidence =
    (isGridName ? 0.3 : 0) +
    (hasCardArray ? 0.3 : 0) +
    (hasGridLayout ? 0.2 : 0) +
    (hasRepeatedCards ? 0.1 : 0) +
    (hasImageAndText ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
    hasImages: true,
    hasText: true,
    itemCount: (jsx.match(/card|Card/gi) || []).length,
  }

  return {
    type: 'cardGrid',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Feature List
 */
function detectFeatureList(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isFeatureName = name.includes('feature') || name.includes('list')
  const hasFeatureArray = /features\s*:\s*\[|items\s*:\s*\[/i.test(jsx)
  const hasIcons = /icon|Icon|svg/i.test(jsx)
  const hasCheckmarks = /check|✓|✔/i.test(jsx)
  const hasRepeatedItems = /\.map\(/i.test(jsx)

  const confidence =
    (isFeatureName ? 0.3 : 0) +
    (hasFeatureArray ? 0.3 : 0) +
    (hasIcons ? 0.2 : 0) +
    (hasCheckmarks ? 0.1 : 0) +
    (hasRepeatedItems ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
  }

  return {
    type: 'featureList',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect FAQ / Accordion
 */
function detectFAQ(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isFAQName = name.includes('faq') || name.includes('accordion') || name.includes('collapse')
  const hasDetails = /<details|<Details/i.test(jsx)
  const hasAccordion = /Accordion|accordion/i.test(jsx)
  const hasQuestions = /question|Question/i.test(jsx)
  const hasAnswers = /answer|Answer/i.test(jsx)
  const hasFAQArray = /faqs\s*:\s*\[|items\s*:\s*\[/i.test(jsx)

  const confidence =
    (isFAQName ? 0.4 : 0) +
    (hasDetails ? 0.2 : 0) +
    (hasAccordion ? 0.2 : 0) +
    (hasQuestions && hasAnswers ? 0.15 : 0) +
    (hasFAQArray ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
  }

  return {
    type: 'faq',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Tabs
 */
function detectTabs(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isTabsName = name.includes('tab')
  const hasTabsComponent = /<Tabs|<TabList|<Tab/i.test(jsx)
  const hasTabArray = /tabs\s*:\s*\[|items\s*:\s*\[/i.test(jsx)
  const hasTabLabels = /label|Label/i.test(jsx)

  const confidence =
    (isTabsName ? 0.4 : 0) +
    (hasTabsComponent ? 0.4 : 0) +
    (hasTabArray ? 0.1 : 0) +
    (hasTabLabels ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
  }

  return {
    type: 'tabs',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Video Block
 */
function detectVideo(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isVideoName = name.includes('video')
  const hasVideoTag = /<video|<Video/i.test(jsx)
  const hasYouTube = /youtube|youtu\.be/i.test(jsx)
  const hasVimeo = /vimeo/i.test(jsx)
  const hasVideoUrl = Object.values(component.props).some(v => isVideoUrl(v))

  const confidence =
    (isVideoName ? 0.3 : 0) +
    (hasVideoTag ? 0.3 : 0) +
    (hasYouTube ? 0.2 : 0) +
    (hasVimeo ? 0.15 : 0) +
    (hasVideoUrl ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasVideo: true,
  }

  return {
    type: 'video',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Slider / Carousel
 */
function detectSlider(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isSliderName = name.includes('slider') || name.includes('carousel') || name.includes('swiper')
  const hasSwiper = /Swiper|swiper/i.test(jsx)
  const hasSplide = /Splide|splide/i.test(jsx)
  const hasSlides = /slides\s*:\s*\[|items\s*:\s*\[/i.test(jsx)
  const hasNavigation = /navigation|arrows|dots/i.test(jsx)

  const confidence =
    (isSliderName ? 0.4 : 0) +
    (hasSwiper ? 0.3 : 0) +
    (hasSplide ? 0.2 : 0) +
    (hasSlides ? 0.05 : 0) +
    (hasNavigation ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
    hasImages: true,
  }

  return {
    type: 'slider',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect CTA Banner
 */
function detectCTABanner(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isCTAName = name.includes('cta') || name.includes('banner')
  const hasButtons = /button|cta|link/i.test(jsx)
  const hasTitle = /title|heading/i.test(Object.keys(component.props).join(' '))
  const hasSubtitle = /subtitle|description/i.test(Object.keys(component.props).join(' '))
  const hasBackground = /bg-gradient|background/i.test(jsx)
  const noImages = !/<img|Image/i.test(jsx)

  const confidence =
    (isCTAName ? 0.3 : 0) +
    (hasButtons ? 0.25 : 0) +
    (hasTitle ? 0.15 : 0) +
    (hasSubtitle ? 0.1 : 0) +
    (hasBackground ? 0.1 : 0) +
    (noImages ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasTitle: true,
    hasSubtitle: true,
    hasButtons: true,
  }

  return {
    type: 'ctaBanner',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Testimonials
 */
function detectTestimonials(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isTestimonialName = name.includes('testimonial') || name.includes('review')
  const hasTestimonialsArray = /testimonials\s*:\s*\[|reviews\s*:\s*\[/i.test(jsx)
  const hasAvatar = /avatar|Avatar|photo/i.test(jsx)
  const hasQuote = /quote|Quote|"|'/i.test(jsx)
  const hasName = /name|Name/i.test(jsx)

  const confidence =
    (isTestimonialName ? 0.4 : 0) +
    (hasTestimonialsArray ? 0.3 : 0) +
    (hasAvatar ? 0.15 : 0) +
    (hasQuote ? 0.1 : 0) +
    (hasName ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
    hasImages: true,
  }

  return {
    type: 'testimonials',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Logo Cloud
 */
function detectLogoCloud(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isLogoName = name.includes('logo') || name.includes('cloud')
  const hasLogosArray = /logos\s*:\s*\[|brands\s*:\s*\[/i.test(jsx)
  const hasMultipleLogos = (jsx.match(/logo|Logo|img/gi) || []).length > 3
  const hasRowLayout = /flex.*row|grid.*cols/i.test(jsx)

  const confidence =
    (isLogoName ? 0.4 : 0) +
    (hasLogosArray ? 0.3 : 0) +
    (hasMultipleLogos ? 0.2 : 0) +
    (hasRowLayout ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
    hasImages: true,
  }

  return {
    type: 'logoCloud',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Pricing Table
 */
function detectPricingTable(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isPricingName = name.includes('pricing') || name.includes('price')
  const hasPlansArray = /plans\s*:\s*\[|prices\s*:\s*\[/i.test(jsx)
  const hasPrice = /price|Price|\$|€/i.test(jsx)
  const hasFeatures = /features|Features/i.test(jsx)
  const hasMultipleColumns = /grid-cols-3|grid-cols-4/i.test(jsx)

  const confidence =
    (isPricingName ? 0.4 : 0) +
    (hasPlansArray ? 0.3 : 0) +
    (hasPrice ? 0.15 : 0) +
    (hasFeatures ? 0.1 : 0) +
    (hasMultipleColumns ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    isRepeated: true,
  }

  return {
    type: 'pricingTable',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Contact Form
 */
function detectContactForm(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isFormName = name.includes('form') || name.includes('contact')
  const hasFormTag = /<form|<Form/i.test(jsx)
  const hasInputs = /<input|<Input|<textarea|<Textarea/i.test(jsx)
  const hasNameField = /name|Name/i.test(jsx)
  const hasEmailField = /email|Email|type="email"/i.test(jsx)
  const hasSubmit = /submit|Submit|button.*type="submit"/i.test(jsx)

  const confidence =
    (isFormName ? 0.3 : 0) +
    (hasFormTag ? 0.3 : 0) +
    (hasInputs ? 0.2 : 0) +
    (hasNameField ? 0.1 : 0) +
    (hasEmailField ? 0.05 : 0) +
    (hasSubmit ? 0.05 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasForm: true,
  }

  return {
    type: 'contactForm',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Map Block
 */
function detectMap(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isMapName = name.includes('map')
  const hasIframe = /<iframe/i.test(jsx)
  const hasGoogleMaps = /google.*maps|maps\.google/i.test(jsx)
  const hasMapUrl = Object.values(component.props).some(v => isMapEmbed(v))

  const confidence =
    (isMapName ? 0.4 : 0) +
    (hasIframe ? 0.3 : 0) +
    (hasGoogleMaps ? 0.2 : 0) +
    (hasMapUrl ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  const metadata: PatternMetadata = {
    hasMap: true,
  }

  return {
    type: 'map',
    confidence,
    metadata,
    props,
    children: component.children,
  }
}

/**
 * Detect Navigation
 */
function detectNavigation(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isNavName = name.includes('nav') || name.includes('menu') || name.includes('header')
  const hasNavTag = /<nav|<Nav/i.test(jsx)
  const hasLinks = /<a|<Link|href/i.test(jsx)
  const hasMenuArray = /items\s*:\s*\[|links\s*:\s*\[|menu\s*:\s*\[/i.test(jsx)

  const confidence =
    (isNavName ? 0.4 : 0) +
    (hasNavTag ? 0.3 : 0) +
    (hasLinks ? 0.2 : 0) +
    (hasMenuArray ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  return {
    type: 'navigation',
    confidence,
    metadata: {},
    props,
    children: component.children,
  }
}

/**
 * Detect Footer
 */
function detectFooter(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const name = component.name.toLowerCase()

  const isFooterName = name.includes('footer')
  const hasFooterTag = /<footer|<Footer/i.test(jsx)
  const hasColumns = /grid-cols-2|grid-cols-3|grid-cols-4/i.test(jsx)
  const hasSocialIcons = /social|Social|icon/i.test(jsx)

  const confidence =
    (isFooterName ? 0.4 : 0) +
    (hasFooterTag ? 0.3 : 0) +
    (hasColumns ? 0.2 : 0) +
    (hasSocialIcons ? 0.1 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  return {
    type: 'footer',
    confidence,
    metadata: {},
    props,
    children: component.children,
  }
}

/**
 * Detect Grid Layout
 */
function detectGridLayout(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const hasGrid = /grid|grid-cols/i.test(jsx)
  const hasMappedItems = /\.map\(/i.test(jsx)
  const hasMultipleChildren = component.children.length > 2

  const confidence = (hasGrid ? 0.5 : 0) + (hasMappedItems ? 0.3 : 0) + (hasMultipleChildren ? 0.2 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  return {
    type: 'gridLayout',
    confidence,
    metadata: {
      isRepeated: true,
    },
    props,
    children: component.children,
  }
}

/**
 * Detect Raw HTML
 */
function detectRawHtml(component: ComponentNode): DetectedPattern | null {
  const jsx = component.jsx
  const hasDangerousHTML = /dangerouslySetInnerHTML/i.test(jsx)
  const hasInnerHTML = /innerHTML/i.test(jsx)
  const hasRawHTML = /<[^>]+>/i.test(jsx) && !/<[A-Z]/.test(jsx)

  const confidence = (hasDangerousHTML ? 0.5 : 0) + (hasInnerHTML ? 0.3 : 0) + (hasRawHTML ? 0.2 : 0)

  if (confidence < 0.5) return null

  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, jsx)
  })

  return {
    type: 'rawHtml',
    confidence,
    metadata: {},
    props,
    children: component.children,
  }
}

/**
 * Generic Content Block (fallback)
 */
function detectGenericContentBlock(component: ComponentNode): DetectedPattern {
  const props: Record<string, PropInfo> = {}
  Object.entries(component.props).forEach(([key, value]) => {
    props[key] = extractPropInfo(key, value, component.jsx)
  })

  return {
    type: 'genericContentBlock',
    confidence: 0.3,
    metadata: {},
    props,
    children: component.children,
  }
}

