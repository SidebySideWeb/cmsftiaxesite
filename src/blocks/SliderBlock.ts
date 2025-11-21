import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const SliderBlock: Block = {
  slug: 'slider',
  labels: {
    singular: 'Slider',
    plural: 'Sliders',
  },
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
