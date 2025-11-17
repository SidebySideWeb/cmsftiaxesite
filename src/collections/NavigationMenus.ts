import type { CollectionConfig } from 'payload'
import { tenantReadAccess, tenantCreateAccess, tenantUpdateAccess, tenantDeleteAccess } from '../access/tenantAccess'
import { isSuperAdmin } from '../access/roles'

export const NavigationMenus: CollectionConfig = {
  slug: 'navigation-menus',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'updatedAt'],
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
        description: 'The tenant this navigation menu belongs to',
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
              label: 'Menu Title',
              admin: {
                description: 'e.g., "Main Menu", "Footer Menu"',
              },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Menu Items',
              minRows: 0,
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  label: 'Label',
                },
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  defaultValue: 'internal',
                  options: [
                    {
                      label: 'Internal Page',
                      value: 'internal',
                    },
                    {
                      label: 'External URL',
                      value: 'external',
                    },
                  ],
                  label: 'Link Type',
                },
                {
                  name: 'page',
                  type: 'relationship',
                  relationTo: 'pages',
                  label: 'Page',
                  admin: {
                    condition: (data, siblingData) => {
                      return siblingData?.type === 'internal'
                    },
                    description: 'Select a page for internal links',
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'URL',
                  admin: {
                    condition: (data, siblingData) => {
                      return siblingData?.type === 'external'
                    },
                    description: 'External URL (e.g., https://example.com)',
                  },
                },
                {
                  name: 'openInNewTab',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Open in New Tab',
                },
              ],
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
