import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Hero", "Features")',
        placeholder: 'Hero',
      },
    },
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
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'Call-to-Action Label',
    },
    {
      name: 'ctaUrl',
      type: 'text',
      label: 'Call-to-Action URL',
    },
  ],
}

