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
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 3,
      admin: {
        description: 'Minimum 3 cards required',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Card Image',
          admin: {
            description: 'If not uploaded, will use default program image',
          },
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

