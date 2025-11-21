/**
 * Type inference engine for V0 components
 */

import type { PropInfo, PropType } from './types'

/**
 * Infer prop type from value, usage, or naming conventions
 */
export function inferPropType(
  propName: string,
  propValue: any,
  usageContext?: string
): PropType {
  // Check naming conventions
  const lowerName = propName.toLowerCase()

  // Image indicators
  if (
    lowerName.includes('image') ||
    lowerName.includes('img') ||
    lowerName.includes('photo') ||
    lowerName.includes('picture') ||
    lowerName.includes('avatar') ||
    lowerName.includes('logo') ||
    lowerName.includes('icon')
  ) {
    return 'image'
  }

  // URL indicators
  if (
    lowerName.includes('url') ||
    lowerName.includes('link') ||
    lowerName.includes('href') ||
    lowerName.includes('src') ||
    lowerName.includes('video') ||
    lowerName.includes('embed')
  ) {
    return 'url'
  }

  // Rich text indicators
  if (
    lowerName.includes('content') ||
    lowerName.includes('text') ||
    lowerName.includes('description') ||
    lowerName.includes('body') ||
    lowerName.includes('html') ||
    lowerName.includes('markdown')
  ) {
    if (usageContext?.includes('dangerouslySetInnerHTML') || usageContext?.includes('innerHTML')) {
      return 'html'
    }
    if (usageContext?.includes('<p>') || usageContext?.includes('<h')) {
      return 'richText'
    }
    return 'richText'
  }

  // Array indicators
  if (
    lowerName.includes('items') ||
    lowerName.includes('list') ||
    lowerName.includes('array') ||
    lowerName.includes('features') ||
    lowerName.includes('cards') ||
    lowerName.includes('slides') ||
    lowerName.includes('tabs') ||
    lowerName.includes('testimonials') ||
    lowerName.includes('logos') ||
    lowerName.includes('plans')
  ) {
    return 'array'
  }

  // Component indicators
  if (
    lowerName.includes('component') ||
    lowerName.includes('children') ||
    (typeof propValue === 'object' && propValue?.type)
  ) {
    return 'component'
  }

  // Check actual value type
  if (propValue !== undefined && propValue !== null) {
    if (Array.isArray(propValue)) {
      return 'array'
    }
    if (typeof propValue === 'object') {
      return 'object'
    }
    if (typeof propValue === 'boolean') {
      return 'boolean'
    }
    if (typeof propValue === 'number') {
      return 'number'
    }
    if (typeof propValue === 'string') {
      // Check if it's a URL
      if (
        propValue.startsWith('http') ||
        propValue.startsWith('//') ||
        propValue.startsWith('/')
      ) {
        return 'url'
      }
      return 'string'
    }
  }

  // Default to string
  return 'string'
}

/**
 * Extract prop information from component
 */
export function extractPropInfo(
  propName: string,
  propValue: any,
  usageContext?: string
): PropInfo {
  const type = inferPropType(propName, propValue, usageContext)

  return {
    name: propName,
    type,
    required: propValue === undefined ? false : true,
    defaultValue: propValue,
  }
}

/**
 * Detect if a string contains HTML
 */
export function containsHTML(str: string): boolean {
  if (typeof str !== 'string') return false
  return /<[a-z][\s\S]*>/i.test(str)
}

/**
 * Detect if content is rich text (multiple paragraphs, headings, lists)
 */
export function isRichText(content: string): boolean {
  if (typeof content !== 'string') return false
  const htmlTags = ['<p>', '<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>', '<ul>', '<ol>', '<li>', '<strong>', '<em>', '<br>']
  return htmlTags.some(tag => content.includes(tag))
}

/**
 * Detect if a value is an image URL
 */
export function isImageUrl(value: any): boolean {
  if (typeof value !== 'string') return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  return imageExtensions.some(ext => value.toLowerCase().includes(ext)) ||
    value.includes('blob') ||
    value.includes('image') ||
    value.includes('photo')
}

/**
 * Detect if a value is a video URL
 */
export function isVideoUrl(value: any): boolean {
  if (typeof value !== 'string') return false
  return value.includes('youtube') ||
    value.includes('youtu.be') ||
    value.includes('vimeo') ||
    value.includes('video') ||
    value.match(/\.(mp4|webm|ogg)$/i)
}

/**
 * Detect if a value is a map embed
 */
export function isMapEmbed(value: any): boolean {
  if (typeof value !== 'string') return false
  return value.includes('google.com/maps') ||
    value.includes('maps.google') ||
    value.includes('openstreetmap')
}

