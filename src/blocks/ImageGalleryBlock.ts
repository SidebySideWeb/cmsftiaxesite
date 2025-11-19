import type { Block } from 'payload'

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
      label: 'Section Title',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
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
  ],
}

