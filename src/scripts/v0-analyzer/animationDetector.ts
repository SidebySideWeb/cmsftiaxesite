/**
 * Animation and motion detection for V0 components
 */

import type { AnimationInfo, ScrollRevealInfo, RenderingHints } from './types'

/**
 * Detect Framer Motion usage
 */
export function detectFramerMotion(jsx: string, imports: any[]): AnimationInfo | null {
  const hasFramerMotionImport = imports.some(
    imp => imp.source === 'framer-motion' || imp.source?.includes('framer-motion')
  )

  const hasMotionElements = /<motion\.(div|section|article|header|footer|nav|aside|main|span|p|h[1-6]|img|button|a)/i.test(jsx)

  if (!hasFramerMotionImport && !hasMotionElements) {
    return null
  }

  // Extract animation props
  const initialMatch = jsx.match(/initial\s*=\s*{([^}]+)}/i)
  const animateMatch = jsx.match(/animate\s*=\s*{([^}]+)}/i)
  const exitMatch = jsx.match(/exit\s*=\s*{([^}]+)}/i)
  const whileInViewMatch = jsx.match(/whileInView\s*=\s*{([^}]+)}/i)
  const transitionMatch = jsx.match(/transition\s*=\s*{([^}]+)}/i)

  const config: any = {
    type: 'framerMotion',
  }

  if (initialMatch) {
    try {
      config.initial = parseObjectString(initialMatch[1])
    } catch (e) {
      config.initial = {}
    }
  }

  if (animateMatch) {
    try {
      config.animate = parseObjectString(animateMatch[1])
    } catch (e) {
      config.animate = {}
    }
  }

  if (exitMatch) {
    try {
      config.exit = parseObjectString(exitMatch[1])
    } catch (e) {
      config.exit = {}
    }
  }

  if (whileInViewMatch) {
    try {
      config.whileInView = parseObjectString(whileInViewMatch[1])
    } catch (e) {
      config.whileInView = {}
    }
  }

  if (transitionMatch) {
    try {
      config.transition = parseObjectString(transitionMatch[1])
    } catch (e) {
      config.transition = {}
    }
  }

  return {
    enabled: true,
    engine: 'framerMotion',
    config,
  }
}

/**
 * Detect GSAP usage
 */
export function detectGSAP(jsx: string, imports: any[]): AnimationInfo | null {
  const hasGSAPImport = imports.some(
    imp => imp.source === 'gsap' || imp.source?.includes('gsap')
  )

  const hasScrollTrigger = imports.some(
    imp => imp.source?.includes('ScrollTrigger')
  )

  if (!hasGSAPImport) {
    return null
  }

  // Extract GSAP config
  const gsapMatch = jsx.match(/gsap\.(to|from|timeline)\(/i)
  const scrollTriggerMatch = jsx.match(/ScrollTrigger\.(create|refresh)/i)

  const config: any = {
    type: 'gsap',
    timeline: !!gsapMatch?.includes('timeline'),
    scrollTrigger: hasScrollTrigger || !!scrollTriggerMatch,
  }

  // Try to extract raw config
  const configMatch = jsx.match(/\{([^}]*duration[^}]*)\}/i)
  if (configMatch) {
    try {
      config.rawConfig = parseObjectString(configMatch[1])
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return {
    enabled: true,
    engine: 'gsap',
    config,
  }
}

/**
 * Detect CSS/Tailwind animations
 */
export function detectCSSAnimations(jsx: string): AnimationInfo | null {
  // Tailwind animation classes
  const animationClasses = [
    'transition',
    'duration-',
    'delay-',
    'ease-',
    'animate-',
    'hover:',
    'focus:',
    'active:',
    'group-hover:',
  ]

  const foundClasses: string[] = []
  const classRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/gi
  let match

  while ((match = classRegex.exec(jsx)) !== null) {
    const classes = match[1].split(/\s+/)
    classes.forEach(cls => {
      if (animationClasses.some(animClass => cls.includes(animClass))) {
        foundClasses.push(cls)
      }
    })
  }

  if (foundClasses.length === 0) {
    return null
  }

  return {
    enabled: true,
    engine: 'css',
    config: {
      type: 'css',
      classes: foundClasses,
    },
  }
}

/**
 * Detect scroll-based reveal animations
 */
export function detectScrollReveal(jsx: string, imports: any[]): ScrollRevealInfo | null {
  const hasUseInView = imports.some(
    imp => imp.named?.includes('useInView') || imp.default === 'useInView'
  )

  const hasIntersectionObserver = jsx.includes('IntersectionObserver') ||
    jsx.includes('useIntersectionObserver')

  const hasScrollReveal = jsx.includes('scrollReveal') ||
    jsx.includes('scroll-reveal') ||
    jsx.includes('fade-in-section') ||
    jsx.includes('animate-in')

  if (!hasUseInView && !hasIntersectionObserver && !hasScrollReveal) {
    return null
  }

  // Extract trigger type
  let trigger: 'viewportEnter' | 'viewportCenter' | 'viewportFullyVisible' = 'viewportEnter'

  if (jsx.includes('viewportCenter') || jsx.includes('center')) {
    trigger = 'viewportCenter'
  } else if (jsx.includes('fullyVisible') || jsx.includes('fully')) {
    trigger = 'viewportFullyVisible'
  }

  // Extract once flag
  const once = jsx.includes('once:') || jsx.includes('once: true') || jsx.includes('once={true}')

  // Extract offset
  const offsetMatch = jsx.match(/offset[:\s]*(\d+)/i)
  const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : undefined

  return {
    enabled: true,
    trigger,
    once: !!once,
    offset,
  }
}

/**
 * Generate rendering hints from detected animations
 */
export function generateRenderingHints(
  animation: AnimationInfo | null,
  scrollReveal: ScrollRevealInfo | null,
  jsx: string
): RenderingHints {
  const hasHoverEffects = /hover:/i.test(jsx) || /group-hover:/i.test(jsx)
  const hasInitialAnimation = !!animation?.enabled && !!animation?.config?.initial
  const shouldAnimateOnScroll = !!scrollReveal?.enabled
  const heavyAnimation = animation?.engine === 'gsap' || animation?.engine === 'framerMotion'

  // Check for z-index usage
  const zIndexSensitive = /z-\d+/i.test(jsx) || /z-\[/i.test(jsx)

  // Check viewport preference
  let preferredViewport: 'fullWidth' | 'contained' | 'section' = 'section'
  if (/w-full/i.test(jsx) && /container/i.test(jsx)) {
    preferredViewport = 'contained'
  } else if (/w-full/i.test(jsx) && !/container/i.test(jsx)) {
    preferredViewport = 'fullWidth'
  }

  return {
    shouldAnimateOnScroll,
    hasInitialAnimation,
    hasHoverEffects,
    heavyAnimation,
    preferredViewport,
    zIndexSensitive,
  }
}

/**
 * Parse object-like string into object
 */
function parseObjectString(str: string): Record<string, any> {
  try {
    // Try JSON parsing first
    return JSON.parse(`{${str}}`)
  } catch (e) {
    // Fallback: simple key-value extraction
    const obj: Record<string, any> = {}
    const pairs = str.split(',').map(s => s.trim())
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim())
      if (key && value) {
        obj[key] = parseValue(value)
      }
    })
    return obj
  }
}

/**
 * Parse a value string
 */
function parseValue(str: string): any {
  const trimmed = str.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null' || trimmed === 'undefined') return null
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

