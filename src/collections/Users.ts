import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isTenantAdmin, getTenantId } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: ({ req }) => {
      // Superadmin: can see all users
      if (isSuperAdmin(req)) {
        return true
      }
      
      // TenantAdmin: can see only users with the same tenant
      if (isTenantAdmin(req)) {
        const tenantId = getTenantId(req.user)
        if (!tenantId) return false
        
        return {
          tenant: {
            equals: tenantId,
          },
        }
      }
      
      // Editor: can only read their own user record
      if (req.user) {
        return {
          id: {
            equals: req.user.id,
          },
        }
      }
      
      return false
    },
    create: ({ req }) => {
      // Superadmin: can create all users
      if (isSuperAdmin(req)) {
        return true
      }
      
      // TenantAdmin: can create users within their own tenant (but not superadmins)
      // This will be enforced via field validation
      if (isTenantAdmin(req)) {
        return true
      }
      
      // Editor: cannot create users
      return false
    },
    update: ({ req }) => {
      // Superadmin: can update all users
      if (isSuperAdmin(req)) {
        return true
      }
      
      // TenantAdmin: can update users within their own tenant (but not superadmins)
      if (isTenantAdmin(req)) {
        const tenantId = getTenantId(req.user)
        if (!tenantId) return false
        
        return {
          tenant: {
            equals: tenantId,
          },
          role: {
            not_equals: 'superadmin',
          },
        }
      }
      
      // Editor: cannot update other users (for now, keeping it simple)
      return false
    },
    delete: ({ req }) => {
      // Superadmin: can delete all users
      if (isSuperAdmin(req)) {
        return true
      }
      
      // TenantAdmin: can delete users within their own tenant (but not superadmins)
      if (isTenantAdmin(req)) {
        const tenantId = getTenantId(req.user)
        if (!tenantId) return false
        
        return {
          tenant: {
            equals: tenantId,
          },
          role: {
            not_equals: 'superadmin',
          },
        }
      }
      
      // Editor: cannot delete users
      return false
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        {
          label: 'Super Admin',
          value: 'superadmin',
        },
        {
          label: 'Tenant Admin',
          value: 'tenantAdmin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
      ],
      admin: {
        description: 'User role determines access level and permissions',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      admin: {
        condition: (data) => {
          // Hide tenant field for superadmins
          return data.role !== 'superadmin'
        },
        description: 'Required for Tenant Admin and Editor roles',
      },
      validate: (value, { data, req }) => {
        // Require tenant for non-superadmin roles
        if (data.role !== 'superadmin' && !value) {
          return 'Tenant is required for Tenant Admin and Editor roles'
        }
        return true
      },
    },
  ],
}
