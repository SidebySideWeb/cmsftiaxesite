import type { CollectionConfig } from 'payload'
import { tenantReadAccess, tenantCreateAccess, tenantUpdateAccess, tenantDeleteAccess } from '../access/tenantAccess'
import { isSuperAdmin } from '../access/roles'

export const Headers: CollectionConfig = {
  slug: 'headers',
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
        description: 'The tenant this header belongs to',
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
              defaultValue: 'Default Header',
              admin: {
                description: 'e.g., "Default Header"',
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo',
            },
            {
              name: 'navigationMenu',
              type: 'relationship',
              relationTo: 'navigation-menus',
              label: 'Navigation Menu',
            },
          ],
        },
        {
          label: 'Settings',
          fields: [
            {
              name: 'enableTopBar',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable Top Bar',
            },
            {
              name: 'topBarText',
              type: 'text',
              label: 'Top Bar Text',
              admin: {
                condition: (data, siblingData) => {
                  return siblingData?.enableTopBar === true
                },
                description: 'Text to display in the top bar',
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
