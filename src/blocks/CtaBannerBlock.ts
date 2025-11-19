import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const CtaBannerBlock: Block = {
  slug: 'ctaBanner',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "CTA Banner", "Call to Action")',
        placeholder: 'CTA Banner',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
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
        { label: 'Primary to Secondary', value: 'primary-secondary' },
        { label: 'Accent to Primary', value: 'accent-primary' },
      ],
      defaultValue: 'purple-orange',
    },
  ],
}

