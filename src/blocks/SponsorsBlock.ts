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
      admin: {
        description: 'If empty, will use default title',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'If empty, will use default subtitle',
      },
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
          label: 'Sponsor Logo',
          admin: {
            description: 'Sponsor logo image',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Website URL',
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

