import type { Block } from 'payload'

export const VideoBlock: Block = {
  slug: 'video',
  labels: {
    singular: 'Video',
    plural: 'Videos',
  },
  fields: [
    {
      name: 'blockLabel',
      type: 'text',
      label: 'Section Name',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      required: true,
      admin: {
        description: 'YouTube, Vimeo, or direct video URL',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Thumbnail Image',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
  ],
}
