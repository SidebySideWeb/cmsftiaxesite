import type { Block } from 'payload'

export const MapBlock: Block = {
  slug: 'map',
  labels: {
    singular: 'Map',
    plural: 'Maps',
  },
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
      name: 'mapUrl',
      type: 'text',
      label: 'Map URL',
      required: true,
      admin: {
        description: 'Google Maps embed URL or iframe src',
      },
    },
  ],
}
