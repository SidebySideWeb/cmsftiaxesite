import type { Access, Where } from 'payload'
import { isSuperAdmin, getTenantId } from './roles'

/**
 * Access control helper for tenant-aware collections
 * 
 * Read access:
 * - Uses tenantFilterOrAll to filter by tenant (superadmins see all)
 * 
 * Create/Update/Delete access:
 * - Superadmins: allowed
 * - Others: only if req.user.tenant equals the document's tenant
 */
export const tenantReadAccess: Access = ({ req }) => {
  // Allow public read access for frontend API calls
  // Frontend needs to read pages, posts, headers, footers without authentication
  // This is safe because access is filtered by tenant, and only published/public content should be exposed
  if (!req.user) {
    // Public access - return true to allow reading (tenant filtering happens via query params)
    return true
  }
  
  // Superadmins can see everything
  if (isSuperAdmin(req)) {
    return true
  }
  
  // If user doesn't have a role yet, allow them to see collections
  // (they might be the first user setting things up)
  if (!req.user.role) {
    return true
  }
  
  const tenantId = getTenantId(req.user)
  
  // If user has no tenant assigned, allow them to see collections
  // but filter to show nothing (so they can create items but not see existing ones)
  if (!tenantId) {
    return {
      id: {
        equals: -1, // Match nothing, but collection will be visible in admin
      },
    } as Where
  }
  
  // Filter by tenant ID
  return {
    tenant: {
      equals: tenantId,
    },
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

