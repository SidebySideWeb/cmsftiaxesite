import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ImageGalleryBlock: Block = {
  slug: 'imageGallery',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Gallery", "Images", "Photo Gallery")',
        placeholder: 'Image Gallery',
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
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Image Title',
          admin: {
            description: 'Title shown on hover (e.g., "UV Παράσταση")',
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption/Description',
          admin: {
            description: 'Description shown on hover (e.g., "Μοναδικές στιγμές στη σκηνή")',
          },
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

