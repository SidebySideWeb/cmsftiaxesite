import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ProgramsBlock: Block = {
  slug: 'programs',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "Programs", "Τμήματα")',
        placeholder: 'Programs',
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
      name: 'programs',
      type: 'array',
      label: 'Programs',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Program Title',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Program Image',
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
          name: 'imagePosition',
          type: 'select',
          label: 'Image Position',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          defaultValue: 'left',
        },
        {
          name: 'schedule',
          type: 'array',
          label: 'Schedule',
          fields: [
            {
              name: 'day',
              type: 'text',
              label: 'Day',
            },
            {
              name: 'time',
              type: 'text',
              label: 'Time',
            },
            {
              name: 'level',
              type: 'text',
              label: 'Level',
            },
          ],
        },
        {
          name: 'coach',
          type: 'group',
          label: 'Coach Information',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Coach Name',
            },
            {
              name: 'photo',
              type: 'upload',
              relationTo: 'media',
              label: 'Coach Photo',
            },
            {
              name: 'studies',
              type: 'text',
              label: 'Studies/Qualifications',
            },
            {
              name: 'bio',
              type: 'textarea',
              label: 'Bio',
            },
            {
              name: 'imagePosition',
              type: 'select',
              label: 'Coach Image Position',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              defaultValue: 'left',
            },
          ],
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

