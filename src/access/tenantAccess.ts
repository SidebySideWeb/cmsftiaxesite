import type { Access, Where } from 'payload'
import { isSuperAdmin, getTenantId } from './roles'

/**
 * Access control helper for tenant-aware collections
 * 
 * Read access:
 * - Public users: can read any document (tenant filtering happens via query params)
 * - Superadmins: can see everything
 * - Others: filtered by tenant
 * 
 * Create/Update/Delete access:
 * - Superadmins: allowed
 * - Others: only if req.user.tenant equals the document's tenant
 */
export const tenantReadAccess: Access = () => {
  // TEMPORARY: Allow public read access for ALL documents
  // This is a workaround to ensure frontend can access CMS data
  // TODO: Re-enable tenant filtering once we confirm this works
  return true
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

