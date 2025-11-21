import type { Access, Where } from 'payload'
import { isSuperAdmin, getTenantId } from './roles'

/**
 * Access control helper for tenant-aware collections
 * 
 * Read access:
 * - Public users: can read any document (tenant filtering happens via query params)
 * - Superadmins: can see everything
 * - Others: filtered by tenant (including pages with NULL tenant for backward compatibility)
 * 
 * Create/Update/Delete access:
 * - Superadmins: allowed
 * - Others: only if req.user.tenant equals the document's tenant
 */
export const tenantReadAccess: Access = ({ req }) => {
  // Public users (frontend API calls): allow read access
  // Frontend will filter by tenant using query params
  if (!req.user) {
    return true
  }
  
  // Superadmins see everything
  if (isSuperAdmin(req)) {
    return true
  }
  
  // Authenticated users (admin panel): filter by tenant
  const tenantId = getTenantId(req.user)
  
  // If user has no tenant, deny access
  if (!tenantId) {
    return false
  }
  
  // For now, allow users to see pages with their tenant OR pages without a tenant
  // This handles backward compatibility with pages created before tenant was required
  // TODO: Assign tenants to orphaned pages and then tighten this filter
  return {
    or: [
      {
        tenant: {
          equals: tenantId,
        },
      },
      {
        tenant: {
          exists: false,
        },
      },
    ],
  } as Where
}

/**
 * Create access: superadmin or tenantAdmin/editors on their own tenant
 */
export const tenantCreateAccess: Access = ({ req }) => {
  // Must be authenticated
  if (!req.user) {
    return false
  }
  
  // Superadmins can create anything
  if (isSuperAdmin(req)) {
    return true
  }
  
  // Others can only create documents for their own tenant
  // The tenant field will be validated/enforced during creation
  const tenantId = getTenantId(req.user)
  if (!tenantId) {
    return false
  }
  
  return true
}

/**
 * Update/Delete access: superadmin or tenantAdmin/editors on their own tenant
 */
export const tenantUpdateAccess: Access = ({ req }) => {
  // Must be authenticated
  if (!req.user) {
    return false
  }
  
  // Superadmins can update/delete anything
  if (isSuperAdmin(req)) {
    return true
  }
  
  // Others can only update/delete documents from their own tenant
  const tenantId = getTenantId(req.user)
  if (!tenantId) {
    return false
  }
  
  return {
    tenant: {
      equals: tenantId,
    },
  } as Where
}

/**
 * Same as tenantUpdateAccess for delete operations
 */
export const tenantDeleteAccess: Access = tenantUpdateAccess

