import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isTenantAdmin } from '../access/roles'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'projectName',
  },
  access: {
    read: ({ req }) => {
      // Must be authenticated
      if (!req.user) {
        return false
      }
      // Superadmins and tenant admins can read tenants
      return isSuperAdmin(req) || isTenantAdmin(req)
    },
    create: ({ req }) => {
      // Only superadmins can create tenants
      return isSuperAdmin(req)
    },
    update: ({ req }) => {
      // Only superadmins can update tenants
      return isSuperAdmin(req)
    },
    delete: ({ req }) => {
      // Only superadmins can delete tenants
      return isSuperAdmin(req)
    },
  },
  fields: [
    {
      name: 'projectName',
      type: 'text',
      required: true,
      label: 'Project Name',
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Code',
      admin: {
        description: 'Unique slug-like identifier (e.g., "ftiaxesite", "kallitechnia")',
      },
    },
    {
      name: 'domains',
      type: 'array',
      label: 'Domains',
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
          label: 'Domain',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Inactive',
          value: 'inactive',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Internal notes about this tenant',
      },
    },
    {
      name: 'primaryColor',
      type: 'text',
      label: 'Primary Color',
      admin: {
        description: 'Primary brand color (hex code)',
      },
    },
    {
      name: 'secondaryColor',
      type: 'text',
      label: 'Secondary Color',
      admin: {
        description: 'Secondary brand color (hex code)',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
  ],
}

