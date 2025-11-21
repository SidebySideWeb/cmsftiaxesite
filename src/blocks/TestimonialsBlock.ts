import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonials',
    plural: 'Testimonials',
  },
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
