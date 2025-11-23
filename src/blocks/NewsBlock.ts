import type { Block } from 'payload'

export const NewsBlock: Block = {
  slug: 'news',
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
      admin: {
        description: 'Internal label to identify this section (e.g., "News", "Latest Posts")',
        placeholder: 'News',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        description: 'Section title (e.g., "Νέα & Ανακοινώσεις")',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'Section subtitle',
      },
    },
    {
      name: 'latestCount',
      type: 'number',
      label: 'Number of Posts',
      defaultValue: 3,
      admin: {
        description: 'Number of latest posts to fetch and display (default: 3)',
      },
    },
  ],
}

