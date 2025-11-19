import type { Block } from 'payload'

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
      name: 'description',
      type: 'textarea',
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
        { label: 'Primary to Secondary', value: 'primary-secondary' },
        { label: 'Accent to Primary', value: 'accent-primary' },
      ],
      defaultValue: 'purple-orange',
    },
  ],
}

