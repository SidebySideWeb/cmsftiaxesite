import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const TabsBlock: Block = {
  slug: 'tabs',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
      name: 'tabs',
      type: 'array',
      label: 'Tabs',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Tab Label',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Tab Content',
          required: true,
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
}
