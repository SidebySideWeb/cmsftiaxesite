# Multi-Tenant Collections Implementation

All collections have been implemented according to the specifications with proper access control.

## Access Control Pattern

All tenant-aware collections use the following access pattern:

- **Read**: `tenantReadAccess` - Superadmins see all, others see only their tenant's content
- **Create**: `tenantCreateAccess` - Superadmins can create anything, others can create documents for their own tenant
- **Update/Delete**: `tenantUpdateAccess` / `tenantDeleteAccess` - Superadmins can modify anything, others can only modify their tenant's content

## Collections Implemented

### 1. Pages (`pages`)
- Fields: `tenant`, `title`, `slug`, `seoTitle`, `seoDescription`, `blocks`
- Uses sharedBlocks from `src/blocks`
- Default columns: `['title', 'tenant', 'slug']`

### 2. Posts (`posts`)
- Fields: `tenant`, `title`, `slug`, `excerpt`, `content` (richText), `publishedAt`
- Uses lexical editor for rich text content

### 3. NavigationMenus (`navigation-menus`)
- Fields: `tenant`, `title`, `items[]`
- Menu items support:
  - `type`: "internal" or "external"
  - `page`: relationship (shown only if type = internal)
  - `url`: text (shown only if type = external)
  - `openInNewTab`: checkbox

### 4. Headers (`headers`)
- Fields: `tenant`, `label`, `logo`, `navigation` (relationship to navigation-menus), `showTopBar`, `topBarText`
- TopBar text is conditionally shown based on `showTopBar` checkbox
- **TODO**: Add beforeChange hook to enforce one header per tenant (commented in code)

### 5. Footers (`footers`)
- Fields: `tenant`, `label`, `navigation` (relationship to navigation-menus), `copyrightText`, `socialLinks[]`
- Social links have `label` and `url`

### 6. Homepages (`homepages`)
- Fields: `tenant`, `label`, `slug` (default: "home", hidden), `blocks`
- Uses sharedBlocks from `src/blocks`
- Treated as singleton per tenant (slug = "home")
- **Frontend Integration Comments**: See file for example queries

### 7. Media (`media`)
- Fields: `tenant`, `alt`
- Public read access for frontend usage
- Create/Update/Delete follow tenant access pattern

## Configuration

### payload.config.ts

- **serverURL**: `process.env.PAYLOAD_SERVER_URL || 'https://cms.ftiaxesite.gr'`
- **collections**: All collections registered in correct order:
  1. Users
  2. Tenants
  3. Pages
  4. Posts
  5. NavigationMenus
  6. Headers
  7. Footers
  8. Homepages
  9. Media

## Frontend Integration Notes

Frontend (Next.js) will:

1. Resolve tenant from domain (e.g., ftiaxesite.gr, kallitechnia.gr)
2. Query tenants collection by `domains.domain`
3. Use tenant's ID to filter calls to:
   - `pages`
   - `homepages`
   - `headers`
   - `footers`
   - `navigation-menus`
   - `posts`

Example query (see `Homepages.ts` for full example):

```typescript
// Example: fetch homepage for current tenant
payload.find({
  collection: 'homepages',
  where: {
    and: [
      { tenant: { equals: tenantId } },
      { slug: { equals: 'home' } },
    ],
  },
});
```

## Next Steps

1. **Generate Database Schema:**
   ```bash
   pnpm payload generate:db-schema
   ```

2. **Create Migration:**
   ```bash
   pnpm payload migrate:create --name multi-tenant-collections
   ```

3. **Run Migration:**
   ```bash
   pnpm payload migrate
   ```

4. **Regenerate Import Map:**
   ```bash
   pnpm payload generate:importmap
   ```

5. **Start Server:**
   ```bash
   pnpm dev
   ```

## Important Constraints

- Every tenant-bound collection has the `tenant` relationship field (required)
- Access functions ensure:
  - Superadmins can see everything
  - Tenant-bound users only see their tenant's content
- Schema and access logic are clean, reusable, and strongly typed
- All collections follow the same access pattern for consistency

## Future Enhancements

- [ ] Implement beforeChange hook in Headers collection to enforce one-per-tenant uniqueness
- [ ] Add slug scoping per tenant (composite unique constraints)
- [ ] API-based tenant onboarding
- [ ] Additional role types if needed
- [ ] Tenant-level feature flags

