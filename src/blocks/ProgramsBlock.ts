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
          name: 'timetable',
          type: 'group',
          label: 'Timetable',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Timetable Title',
              defaultValue: 'Εβδομαδιαίο Πρόγραμμα',
            },
            {
              name: 'schedule',
              type: 'array',
              label: 'Schedule Entries',
              fields: [
                {
                  name: 'day',
                  type: 'text',
                  label: 'Day',
                  admin: {
                    description: 'e.g., Δευτέρα, Τρίτη',
                  },
                },
                {
                  name: 'time',
                  type: 'text',
                  label: 'Time',
                  admin: {
                    description: 'e.g., 17:00 - 19:00',
                  },
                },
                {
                  name: 'level',
                  type: 'text',
                  label: 'Level',
                  admin: {
                    description: 'e.g., Αρχάριοι, Μεσαίοι, Προχωρημένοι',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'coach',
          type: 'group',
          label: 'Coach Information',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Coach Section Title',
              defaultValue: 'Προπονητής/τρια',
              admin: {
                description: 'Static title (usually "Προπονητής/τρια")',
              },
            },
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
              name: 'bio',
              type: 'richText',
              label: 'Coach Bio/Description',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                ],
              }),
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

