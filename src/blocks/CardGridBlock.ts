import type { Block } from 'payload'

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
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
        {
          name: 'cta',
          type: 'group',
          label: 'CTA Button',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Button Text',
              defaultValue: 'Μάθετε περισσότερα',
            },
            {
              name: 'url',
              type: 'text',
              label: 'Button URL',
            },
          ],
        },
      ],
    },
  ],
}

