#!/usr/bin/env node
/**
 * Integration script: Analyze V0 components and add to Payload blocks
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// For now, let's create a simpler integration that adds missing block types
// We'll enhance the analyzer later to work with actual V0 components

async function integrateBlocks() {
  console.log('\n🔗 Integrating V0 Blocks into Payload\n')

  const blocksDir = path.join(__dirname, '..', 'src', 'blocks')
  const blocksIndexPath = path.join(blocksDir, 'index.ts')

  // Read existing blocks index
  let blocksIndexContent = fs.readFileSync(blocksIndexPath, 'utf-8')

  // List of additional blocks we want to add (from V0 analyzer patterns)
  const additionalBlocks = [
    { name: 'FAQBlock', slug: 'faq', file: 'FAQBlock.ts' },
    { name: 'TabsBlock', slug: 'tabs', file: 'TabsBlock.ts' },
    { name: 'VideoBlock', slug: 'video', file: 'VideoBlock.ts' },
    { name: 'SliderBlock', slug: 'slider', file: 'SliderBlock.ts' },
    { name: 'TestimonialsBlock', slug: 'testimonials', file: 'TestimonialsBlock.ts' },
    { name: 'LogoCloudBlock', slug: 'logoCloud', file: 'LogoCloudBlock.ts' },
    { name: 'PricingTableBlock', slug: 'pricingTable', file: 'PricingTableBlock.ts' },
    { name: 'ContactFormBlock', slug: 'contactForm', file: 'ContactFormBlock.ts' },
    { name: 'MapBlock', slug: 'map', file: 'MapBlock.ts' },
    { name: 'FeatureListBlock', slug: 'featureList', file: 'FeatureListBlock.ts' },
  ]

  // Check which blocks already exist
  const existingBlocks = []
  const newBlocks = []

  for (const block of additionalBlocks) {
    const blockPath = path.join(blocksDir, block.file)
    if (fs.existsSync(blockPath)) {
      existingBlocks.push(block)
      console.log(`✅ ${block.name} already exists`)
    } else {
      newBlocks.push(block)
      console.log(`➕ ${block.name} will be created`)
    }
  }

  if (newBlocks.length === 0) {
    console.log('\n✅ All blocks already integrated!\n')
    return
  }

  // Create new block files
  console.log(`\n📝 Creating ${newBlocks.length} new block(s)...\n`)

  for (const block of newBlocks) {
    const blockCode = generateBlockCode(block)
    const blockPath = path.join(blocksDir, block.file)
    fs.writeFileSync(blockPath, blockCode)
    console.log(`✅ Created: ${block.file}`)
  }

  // Update blocks index
  console.log('\n📝 Updating blocks index...\n')

  // Add imports
  const newImports = newBlocks.map(b => `import { ${b.name} } from './${b.name.replace('Block', 'Block')}'`).join('\n')
  
  // Add to blocks array
  const newBlockChecks = newBlocks.map(b => `if (${b.name} && ${b.name}.slug) blocks.push(${b.name})`).join('\n')

  // Insert imports before export
  if (!blocksIndexContent.includes(newBlocks[0].name)) {
    const importSection = blocksIndexContent.match(/^\/\/ Blocks are exported here[\s\S]*?import type { Block }/m)
    if (importSection) {
      blocksIndexContent = blocksIndexContent.replace(
        /(import ContactDetailsBlock.*\n)/,
        `$1${newImports}\n`
      )
    }
  }

  // Insert block checks
  if (!blocksIndexContent.includes(newBlocks[0].name)) {
    blocksIndexContent = blocksIndexContent.replace(
      /(if \(ContactDetailsBlock.*blocks\.push\(ContactDetailsBlock\))/,
      `$1\n${newBlockChecks}`
    )
  }

  fs.writeFileSync(blocksIndexPath, blocksIndexContent)
  console.log('✅ Updated blocks/index.ts\n')

  console.log('='.repeat(60))
  console.log('📊 Integration Summary')
  console.log('='.repeat(60))
  console.log(`✅ Created: ${newBlocks.length} block(s)`)
  console.log(`📁 Location: ${blocksDir}`)
  console.log('\n📝 Next steps:')
  console.log('1. Review generated blocks')
  console.log('2. Run: pnpm generate:types')
  console.log('3. Test in Payload admin panel')
  console.log('='.repeat(60) + '\n')
}

function generateBlockCode(block) {
  const blockName = block.name.replace('Block', '')
  const label = blockName.replace(/([A-Z])/g, ' $1').trim()

  // Generate appropriate block code based on type
  switch (block.slug) {
    case 'faq':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section',
      },
    },
    {
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
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
}
`

    case 'tabs':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
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
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
}
`

    case 'video':
      return `import type { Block } from 'payload'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
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
    },
  ],
}
`

    case 'slider':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
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
          editor: lexicalEditor({}),
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link URL',
        },
      ],
    },
  ],
}
`

    case 'testimonials':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
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
          editor: lexicalEditor({}),
        },
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media',
          label: 'Avatar',
        },
      ],
    },
  ],
}
`

    case 'logoCloud':
      return `import type { Block } from 'payload'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
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
    },
  ],
}
`

    case 'pricingTable':
      return `import type { Block } from 'payload'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
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
    },
  ],
}
`

    case 'contactForm':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
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
      editor: lexicalEditor({}),
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
    },
  ],
}
`

    case 'map':
      return `import type { Block } from 'payload'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
      name: 'mapUrl',
      type: 'text',
      label: 'Map URL',
      required: true,
      admin: {
        description: 'Google Maps embed URL or iframe src',
      },
    },
  ],
}
`

    case 'featureList':
      return `import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
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
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
}
`

    default:
      return `import type { Block } from 'payload'

export const ${block.name}: Block = {
  slug: '${block.slug}',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
  ],
}
`
  }
}

integrateBlocks().catch(error => {
  console.error('❌ Fatal error:', error)
  if (error.stack) console.error(error.stack)
  process.exit(1)
})

