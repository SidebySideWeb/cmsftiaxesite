import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const CardGridBlock: Block = {
  slug: 'cardGrid',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Programs", "Services", "Features")',
        placeholder: 'Card Grid',
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
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Card Image',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Card Title',
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Card Content',
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

