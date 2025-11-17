import type { CollectionConfig } from 'payload'
import { tenantReadAccess, tenantCreateAccess, tenantUpdateAccess, tenantDeleteAccess } from '../access/tenantAccess'
import { isSuperAdmin } from '../access/roles'

export const Footers: CollectionConfig = {
  slug: 'footers',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'tenant', 'updatedAt'],
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
        description: 'The tenant this footer belongs to',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'Label',
              defaultValue: 'Default Footer',
              admin: {
                description: 'e.g., "Default Footer"',
              },
            },
            {
              name: 'footerMenus',
              type: 'array',
              label: 'Footer Menus',
              minRows: 0,
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: 'Menu Title',
                },
                {
                  name: 'menu',
                  type: 'relationship',
                  relationTo: 'navigation-menus',
                  label: 'Navigation Menu',
                },
              ],
              admin: {
                components: {
                  RowLabel: 'src/components/FooterRowLabel#FooterRowLabel',
                },
              },
            },
            {
              name: 'copyrightText',
              type: 'text',
              label: 'Copyright Text',
            },
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Social Media Links',
              minRows: 0,
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Twitter', value: 'twitter' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'Other', value: 'other' },
                  ],
                  label: 'Platform',
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'URL',
                  admin: {
                    description: 'Full URL to the social media profile',
                  },
                },
              ],
              admin: {
                components: {
                  RowLabel: 'src/components/SocialLinkRowLabel#SocialLinkRowLabel',
                },
              },
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
                description: 'SEO title (max 60 characters)',
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
