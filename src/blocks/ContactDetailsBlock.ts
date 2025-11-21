import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ContactDetailsBlock: Block = {
  slug: 'contactDetails',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Contact Details", "Registration Info")',
        placeholder: 'Contact Details',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Contact Items',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          admin: {
            description: 'Static title (not editable by default, e.g., "Διεύθυνση", "Τηλέφωνο")',
          },
        },
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          admin: {
            description: 'Static icon type (not editable)',
          },
          options: [
            { label: 'Location', value: 'location' },
            { label: 'Phone', value: 'phone' },
            { label: 'Email', value: 'email' },
            { label: 'Clock', value: 'clock' },
          ],
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content Text',
          admin: {
            description: 'Editable content for this contact item',
          },
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [
              ...defaultFeatures,
            ],
          }),
        },
      ],
    },
  ],
}

