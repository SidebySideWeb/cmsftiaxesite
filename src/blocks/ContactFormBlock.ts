import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ContactFormBlock: Block = {
  slug: 'contactForm',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      editor: lexicalEditor({}),
    },
    {
      name: 'fields',
      type: 'array',
      label: 'Form Fields',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Field Label',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Field Name',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          label: 'Field Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
          ],
          defaultValue: 'text',
        },
        {
          name: 'required',
          type: 'checkbox',
          label: 'Required',
          defaultValue: false,
        },
      ],
    },
  ],
}
