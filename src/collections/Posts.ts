import type { CollectionConfig } from 'payload'
import { lexicalConfig } from '../richtext/lexicalConfig'
import { tenantReadAccess, tenantCreateAccess, tenantUpdateAccess, tenantDeleteAccess } from '../access/tenantAccess'
import { isSuperAdmin } from '../access/roles'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'publishedAt', 'updatedAt'],
  },
  access: {
    read: tenantReadAccess,
    create: tenantCreateAccess,
    update: tenantUpdateAccess,
    delete: tenantDeleteAccess,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Auto-generate slug from title ONLY if not provided
        // Don't overwrite existing slug - it might be set programmatically
        if (!data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        
        // Ensure slug is not empty - if title-based generation failed, use a fallback
        if (!data.slug || data.slug.trim() === '') {
          data.slug = `post-${Date.now()}`
        }
        
        // Auto-set tenant for non-superadmins
        if (operation === 'create' && !isSuperAdmin(req) && req.user?.tenant) {
          const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant
          if (tenantId) {
            data.tenant = tenantId
          }
        }
        
        return data
      },
    ],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      label: 'Tenant',
      admin: {
        condition: (data, siblingData, { user }) => {
          // Only show to superadmins
          return user?.role === 'superadmin'
        },
        description: 'The tenant this post belongs to',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Post Title',
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              label: 'Slug',
              admin: {
                description: 'Auto-generated from title. URL-friendly identifier for this post.',
                readOnly: true,
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Excerpt',
              admin: {
                description: 'Short summary for listings',
              },
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Content',
              editor: lexicalConfig,
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              label: 'SEO Title',
              maxLength: 60,
              admin: {
                description: 'SEO title (max 60 characters). If empty, post title will be used.',
              },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'SEO Description',
              maxLength: 160,
              admin: {
                description: 'SEO meta description (max 160 characters)',
              },
            },
          ],
        },
        {
          label: 'Settings',
          fields: [
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Featured Image',
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              label: 'Author',
            },
            {
              name: 'publishedAt',
              type: 'date',
              label: 'Published At',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            if (operation === 'create' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          () => new Date(),
        ],
      },
    },
  ],
}
