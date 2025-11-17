import type { PayloadRequest, Where } from 'payload'

/**
 * User role types
 * Expected shape of req.user:
 * - req.user.role ∈ ['superadmin', 'tenantAdmin', 'editor']
 * - req.user.tenant is either a tenant id (string/number) or a populated relationship object with .id
 */
export type UserRole = 'superadmin' | 'tenantAdmin' | 'editor'

/**
 * Check if the current user is a super admin
 */
export function isSuperAdmin(req: PayloadRequest): boolean {
  return req.user?.role === 'superadmin'
}

/**
 * Check if the current user is a tenant admin
 */
export function isTenantAdmin(req: PayloadRequest): boolean {
  return req.user?.role === 'tenantAdmin'
}

/**
 * Check if the current user is an editor
 */
export function isEditor(req: PayloadRequest): boolean {
  return req.user?.role === 'editor'
}

/**
 * Get the tenant ID from a user object
 * Handles both direct ID and populated relationship objects
 */
export function getTenantId(user: { tenant?: string | number | { id: string | number } | null } | null | undefined): string | number | null {
  if (!user?.tenant) return null
  
  // If tenant is a populated object, use its id
  if (typeof user.tenant === 'object' && 'id' in user.tenant && user.tenant.id) {
    return user.tenant.id
  }
  
  // If tenant is a direct ID (string or number)
  if (typeof user.tenant === 'string' || typeof user.tenant === 'number') {
    return user.tenant
  }
  
  return null
}

/**
 * Returns a where clause that filters by tenant, or true for superadmins
 * Superadmins can see all content, others only see their tenant's content
 */
export function tenantFilterOrAll(req: PayloadRequest): Where | boolean {
  // Superadmins can see everything
  if (isSuperAdmin(req)) {
    return true
  }
  
  const tenantId = getTenantId(req.user)
  
  // If user has no tenant, deny access
  if (!tenantId) {
    return false
  }
  
  // Filter by tenant ID
  return {
    tenant: {
      equals: tenantId,
    },
  } as Where
}

/**
 * Returns a where clause for tenant equality check
 * - Returns false if user has no tenant
 * - Returns true for superadmins (can see all)
 * - Returns a filter for tenant-bound users
 */
export function tenantEquals(req: PayloadRequest): Where | boolean {
  // Superadmins can see everything
  if (isSuperAdmin(req)) {
    return true
  }
  
  const tenantId = getTenantId(req.user)
  
  // If user has no tenant, deny access
  if (!tenantId) {
    return false
  }
  
  // Filter by tenant ID
  return {
    tenant: {
      equals: tenantId,
    },
  } as Where
}

