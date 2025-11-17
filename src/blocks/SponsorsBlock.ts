import type { Block } from 'payload'

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
      label: 'Section Title',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
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
          required: true,
          label: 'Sponsor Logo',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Sponsor Name',
        },
        {
          name: 'url',
          type: 'text',
          label: 'Sponsor Website URL',
        },
      ],
    },
  ],
}

