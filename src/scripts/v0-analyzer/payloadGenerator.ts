/**
 * Payload CMS Block Schema Generator
 * Converts detected patterns into Payload block schemas
 */

import type {
  DetectedPattern,
  PayloadBlockSchema,
  PayloadField,
  AnimationInfo,
  ScrollRevealInfo,
  ResponsiveInfo,
  RenderingHints,
} from './types'
import { generateRenderingHints } from './animationDetector'

/**
 * Generate Payload block schema from detected pattern
 */
export function generatePayloadSchema(
  pattern: DetectedPattern,
  componentName: string,
  animation?: AnimationInfo | null,
  scrollReveal?: ScrollRevealInfo | null,
  responsive?: ResponsiveInfo | null
): PayloadBlockSchema {
  const slug = pattern.type
  const label = formatBlockLabel(pattern.type, componentName)

  const fields = generateFields(pattern, componentName)

  // Add animation field if detected
  if (animation && animation.enabled) {
    fields.push({
      name: 'animation',
      type: 'group',
      label: 'Animation',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Animation',
          defaultValue: true,
        },
        {
          name: 'engine',
          type: 'select',
          label: 'Animation Engine',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Framer Motion', value: 'framerMotion' },
            { label: 'CSS', value: 'css' },
            { label: 'GSAP', value: 'gsap' },
          ],
          defaultValue: animation.engine,
        },
        {
          name: 'config',
          type: 'json',
          label: 'Animation Configuration',
          admin: {
            description: 'Advanced animation settings',
          },
        },
      ],
    })
  }

  // Add scroll reveal field if detected
  if (scrollReveal && scrollReveal.enabled) {
    fields.push({
      name: 'scrollReveal',
      type: 'group',
      label: 'Scroll Reveal',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Scroll Reveal',
          defaultValue: true,
        },
        {
          name: 'trigger',
          type: 'select',
          label: 'Trigger Point',
          options: [
            { label: 'Viewport Enter', value: 'viewportEnter' },
            { label: 'Viewport Center', value: 'viewportCenter' },
            { label: 'Viewport Fully Visible', value: 'viewportFullyVisible' },
          ],
          defaultValue: scrollReveal.trigger,
        },
        {
          name: 'once',
          type: 'checkbox',
          label: 'Animate Once',
          defaultValue: scrollReveal.once,
        },
        {
          name: 'offset',
          type: 'number',
          label: 'Offset (px)',
          defaultValue: scrollReveal.offset,
        },
      ],
    })
  }

  // Add layout field if responsive detected
  if (responsive && responsive.useCustomLayout) {
    fields.push({
      name: 'layout',
      type: 'group',
      label: 'Layout',
      fields: [
        {
          name: 'useCustomLayout',
          type: 'checkbox',
          label: 'Use Custom Layout',
          defaultValue: true,
        },
        {
          name: 'config',
          type: 'json',
          label: 'Layout Configuration',
          admin: {
            description: 'Responsive layout settings',
          },
        },
      ],
    })
  }

  // Generate rendering hints
  const renderingHints = generateRenderingHints(
    animation || null,
    scrollReveal || null,
    pattern.children[0]?.jsx || ''
  )

  return {
    slug,
    label,
    fields,
    version: 1,
    animation: animation || undefined,
    scrollReveal: scrollReveal || undefined,
    layout: responsive || undefined,
    renderingHints,
  }
}

/**
 * Generate fields based on pattern type
 */
function generateFields(pattern: DetectedPattern, componentName: string): PayloadField[] {
  const fields: PayloadField[] = []

  // Add block label field
  fields.push({
    name: 'blockLabel',
    type: 'text',
    label: 'Block Label',
    admin: {
      description: 'Optional label for this block in the CMS',
    },
  })

  // Generate fields based on pattern type
  switch (pattern.type) {
    case 'hero':
      return generateHeroFields(pattern, fields)
    case 'imageGallery':
      return generateImageGalleryFields(pattern, fields)
    case 'richText':
      return generateRichTextFields(pattern, fields)
    case 'imageText':
      return generateImageTextFields(pattern, fields)
    case 'cardGrid':
      return generateCardGridFields(pattern, fields)
    case 'featureList':
      return generateFeatureListFields(pattern, fields)
    case 'faq':
      return generateFAQFields(pattern, fields)
    case 'tabs':
      return generateTabsFields(pattern, fields)
    case 'video':
      return generateVideoFields(pattern, fields)
    case 'slider':
      return generateSliderFields(pattern, fields)
    case 'ctaBanner':
      return generateCTABannerFields(pattern, fields)
    case 'testimonials':
      return generateTestimonialsFields(pattern, fields)
    case 'logoCloud':
      return generateLogoCloudFields(pattern, fields)
    case 'pricingTable':
      return generatePricingTableFields(pattern, fields)
    case 'contactForm':
      return generateContactFormFields(pattern, fields)
    case 'map':
      return generateMapFields(pattern, fields)
    case 'navigation':
      return generateNavigationFields(pattern, fields)
    case 'footer':
      return generateFooterFields(pattern, fields)
    case 'gridLayout':
      return generateGridLayoutFields(pattern, fields)
    case 'rawHtml':
      return generateRawHtmlFields(pattern, fields)
    default:
      return generateGenericFields(pattern, fields)
  }
}

/**
 * Generate Hero block fields
 */
function generateHeroFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        description: 'Main hero title',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
      admin: {
        description: 'Hero content/subtitle',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
      admin: {
        description: 'Hero background image',
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Button Label',
    },
    {
      name: 'buttonUrl',
      type: 'text',
      label: 'Button URL',
    }
  )
  return baseFields
}

/**
 * Generate Image Gallery block fields
 */
function generateImageGalleryFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Rich Text block fields
 */
function generateRichTextFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'content',
    type: 'richText',
    label: 'Content',
    required: true,
  })
  return baseFields
}

/**
 * Generate Image + Text block fields
 */
function generateImageTextFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
    },
    {
      name: 'imagePosition',
      type: 'select',
      label: 'Image Position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'left',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Button Label',
    },
    {
      name: 'buttonUrl',
      type: 'text',
      label: 'Button URL',
    }
  )
  return baseFields
}

/**
 * Generate Card Grid block fields
 */
function generateCardGridFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content',
        },
        {
          name: 'buttonLabel',
          type: 'text',
          label: 'Button Label',
        },
        {
          name: 'buttonUrl',
          type: 'text',
          label: 'Button URL',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Feature List block fields
 */
function generateFeatureListFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 1,
      fields: [
        {
          name: 'icon',
          type: 'text',
          label: 'Icon',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
        },
        {
          name: 'description',
          type: 'richText',
          label: 'Description',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate FAQ block fields
 */
function generateFAQFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'items',
    type: 'array',
    label: 'FAQ Items',
    minRows: 1,
    fields: [
      {
        name: 'question',
        type: 'text',
        label: 'Question',
        required: true,
      },
      {
        name: 'answer',
        type: 'richText',
        label: 'Answer',
        required: true,
      },
    ],
  })
  return baseFields
}

/**
 * Generate Tabs block fields
 */
function generateTabsFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'tabs',
    type: 'array',
    label: 'Tabs',
    minRows: 1,
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Tab Label',
        required: true,
      },
      {
        name: 'content',
        type: 'richText',
        label: 'Tab Content',
        required: true,
      },
    ],
  })
  return baseFields
}

/**
 * Generate Video block fields
 */
function generateVideoFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      required: true,
      admin: {
        description: 'YouTube, Vimeo, or direct video URL',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Thumbnail Image',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    }
  )
  return baseFields
}

/**
 * Generate Slider block fields
 */
function generateSliderFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'slides',
    type: 'array',
    label: 'Slides',
    minRows: 1,
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Image',
      },
      {
        name: 'title',
        type: 'text',
        label: 'Title',
      },
      {
        name: 'text',
        type: 'richText',
        label: 'Text',
      },
      {
        name: 'link',
        type: 'text',
        label: 'Link URL',
      },
    ],
  })
  return baseFields
}

/**
 * Generate CTA Banner block fields
 */
function generateCTABannerFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Button Label',
    },
    {
      name: 'buttonUrl',
      type: 'text',
      label: 'Button URL',
    },
    {
      name: 'backgroundGradient',
      type: 'select',
      label: 'Background Gradient',
      options: [
        { label: 'Purple to Orange', value: 'purple-orange' },
        { label: 'Blue to Purple', value: 'blue-purple' },
        { label: 'Green to Blue', value: 'green-blue' },
      ],
      defaultValue: 'purple-orange',
    }
  )
  return baseFields
}

/**
 * Generate Testimonials block fields
 */
function generateTestimonialsFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'testimonials',
    type: 'array',
    label: 'Testimonials',
    minRows: 1,
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      },
      {
        name: 'quote',
        type: 'richText',
        label: 'Quote',
        required: true,
      },
      {
        name: 'avatar',
        type: 'upload',
        relationTo: 'media',
        label: 'Avatar',
      },
    ],
  })
  return baseFields
}

/**
 * Generate Logo Cloud block fields
 */
function generateLogoCloudFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      minRows: 1,
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Link URL',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Pricing Table block fields
 */
function generatePricingTableFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'plans',
      type: 'array',
      label: 'Plans',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Plan Title',
          required: true,
        },
        {
          name: 'price',
          type: 'text',
          label: 'Price',
        },
        {
          name: 'features',
          type: 'array',
          label: 'Features',
          fields: [
            {
              name: 'feature',
              type: 'text',
              label: 'Feature',
            },
          ],
        },
        {
          name: 'buttonLabel',
          type: 'text',
          label: 'Button Label',
        },
        {
          name: 'buttonUrl',
          type: 'text',
          label: 'Button URL',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Contact Form block fields
 */
function generateContactFormFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'fields',
      type: 'array',
      label: 'Form Fields',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Field Label',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Field Name',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          label: 'Field Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
          ],
          defaultValue: 'text',
        },
        {
          name: 'required',
          type: 'checkbox',
          label: 'Required',
          defaultValue: false,
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Map block fields
 */
function generateMapFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'mapUrl',
    type: 'text',
    label: 'Map URL',
    required: true,
    admin: {
      description: 'Google Maps embed URL or iframe src',
    },
  })
  return baseFields
}

/**
 * Generate Navigation block fields
 */
function generateNavigationFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'items',
    type: 'array',
    label: 'Menu Items',
    minRows: 0,
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        required: true,
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL',
        required: true,
      },
    ],
  })
  return baseFields
}

/**
 * Generate Footer block fields
 */
function generateFooterFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push(
    {
      name: 'columns',
      type: 'array',
      label: 'Footer Columns',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Column Title',
        },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Link Label',
            },
            {
              name: 'url',
              type: 'text',
              label: 'Link URL',
            },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      fields: [
        {
          name: 'platform',
          type: 'text',
          label: 'Platform',
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
        },
      ],
    }
  )
  return baseFields
}

/**
 * Generate Grid Layout block fields
 */
function generateGridLayoutFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'items',
    type: 'array',
    label: 'Grid Items',
    minRows: 1,
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
      },
      {
        name: 'description',
        type: 'richText',
        label: 'Description',
      },
      {
        name: 'icon',
        type: 'text',
        label: 'Icon',
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Image',
      },
    ],
  })
  return baseFields
}

/**
 * Generate Raw HTML block fields
 */
function generateRawHtmlFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  baseFields.push({
    name: 'html',
    type: 'textarea',
    label: 'HTML Content',
    admin: {
      description: 'Raw HTML content (use with caution)',
    },
  })
  return baseFields
}

/**
 * Generate Generic block fields (fallback)
 */
function generateGenericFields(pattern: DetectedPattern, baseFields: PayloadField[]): PayloadField[] {
  // Extract all string props as text fields
  Object.entries(pattern.props).forEach(([key, prop]) => {
    if (prop.type === 'string' || prop.type === 'text') {
      baseFields.push({
        name: key,
        type: 'text',
        label: formatFieldLabel(key),
      })
    } else if (prop.type === 'richText' || prop.type === 'html') {
      baseFields.push({
        name: key,
        type: 'richText',
        label: formatFieldLabel(key),
      })
    } else if (prop.type === 'image') {
      baseFields.push({
        name: key,
        type: 'upload',
        relationTo: 'media',
        label: formatFieldLabel(key),
      })
    } else if (prop.type === 'url') {
      baseFields.push({
        name: key,
        type: 'text',
        label: formatFieldLabel(key),
        admin: {
          description: 'URL',
        },
      })
    }
  })

  // Add children as richText if present
  if (pattern.children.length > 0) {
    baseFields.push({
      name: 'content',
      type: 'richText',
      label: 'Content',
    })
  }

  return baseFields
}

/**
 * Format block label from type and component name
 */
function formatBlockLabel(blockType: string, componentName: string): string {
  const typeLabel = blockType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
  return `${typeLabel} Block`
}

/**
 * Format field label from prop name
 */
function formatFieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

