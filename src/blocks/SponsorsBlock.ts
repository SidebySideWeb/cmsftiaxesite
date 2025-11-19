import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const SponsorsBlock: Block = {
  slug: 'sponsors',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Sponsors", "Partners")',
        placeholder: 'Sponsors',
      },
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
      admin: {
        description: 'Long text with styling options, bullets, and numbered lists',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
        ],
      }),
    },
    {
      name: 'sponsors',
      type: 'array',
      label: 'Sponsors',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Sponsor Logo',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Sponsor Name',
        },
        {
          name: 'url',
          type: 'text',
          label: 'Sponsor Website URL',
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

