# Multi-Tenant SaaS Content Model

This Payload CMS installation implements a scalable multi-tenant SaaS content model where:

- **Super Admins** can see and manage all tenants and all content
- **Tenant Admins** can manage users and content for their own tenant
- **Editors** can create and edit content for their own tenant

## Architecture

### Collections Created

1. **Tenants** (`tenants`)
   - Core tenant configuration
   - Fields: `projectName`, `code`, `domains`, `status`, `notes`, `primaryColor`, `secondaryColor`, `logo`
   - Only superadmins can create/update/delete tenants

2. **Users** (`users`)
   - Enhanced with `role` (superadmin, tenantAdmin, editor) and `tenant` relationship
   - Access control based on role and tenant assignment
   - Tenant field is required for non-superadmin roles

3. **Media** (`media`)
   - Tenant-aware media uploads
   - Public read access for frontend usage
   - Tenant relationship required

4. **Pages** (`pages`)
   - Tenant-specific pages with blocks layout
   - Fields: `title`, `slug`, `tenant`, `layout` (blocks), SEO fields
   - Global slug uniqueness

5. **Posts** (`posts`)
   - Tenant-specific blog/news posts
   - Fields: `title`, `slug`, `tenant`, `excerpt`, `content` (blocks), `featuredImage`, `author`, `publishedAt`, SEO fields
   - Global slug uniqueness

6. **Header** (`header`)
   - One header configuration per tenant (unique tenant relationship)
   - Logo, navigation items, CTA button

7. **Footer** (`footer`)
   - One footer configuration per tenant (unique tenant relationship)
   - Copyright, columns, social links, additional content

8. **Homepage** (`homepage`)
   - One homepage per tenant (unique tenant relationship)
   - Hero section, page sections (blocks), SEO fields

9. **NavigationMenu** (`navigation-menu`)
   - Multiple navigation menus per tenant
   - Hierarchical menu items with submenus

### Blocks

Shared blocks available for use in Pages, Posts, and Homepage:

- **HeroBlock** - Hero section with title, subtitle, background image, CTA
- **RichTextBlock** - Rich text content with lexical editor
- **ImageGalleryBlock** - Image gallery with captions

### Access Control

The access control system is centralized in `src/access/roles.ts`:

- `isSuperAdmin(req)` - Check if user is super admin
- `isTenantAdmin(req)` - Check if user is tenant admin
- `isEditor(req)` - Check if user is editor
- `getTenantId(user)` - Extract tenant ID from user object
- `tenantFilterOrAll(req)` - Returns `true` for superadmins, or tenant filter for others
- `tenantEquals(req)` - Same as above but returns `false` if user has no tenant

### Access Rules

**Tenants Collection:**
- Read: Superadmins, TenantAdmins
- Create/Update/Delete: Superadmins only

**Users Collection:**
- Read:
  - Superadmins: All users
  - TenantAdmins: Users in their tenant
  - Editors: Only their own record
- Create:
  - Superadmins: All users
  - TenantAdmins: Users in their tenant (cannot create superadmins)
  - Editors: None
- Update/Delete:
  - Superadmins: All users
  - TenantAdmins: Users in their tenant (cannot modify superadmins)
  - Editors: None

**Content Collections (Pages, Posts, Header, Footer, Homepage, NavigationMenu, Media):**
- All operations: Filtered by tenant (superadmins see all)

## Setup Steps

1. **Generate Database Schema:**
   ```bash
   pnpm payload generate:db-schema
   ```

2. **Create Migration:**
   ```bash
   pnpm payload migrate:create --name multi-tenant-setup
   ```

3. **Run Migration:**
   ```bash
   pnpm payload migrate
   ```

4. **Generate Import Map:**
   ```bash
   pnpm payload generate:importmap
   ```

5. **Create First Super Admin:**
   - Start the dev server: `pnpm dev`
   - Go to `/admin`
   - Create the first user with role "Super Admin"
   - This user will not require a tenant

6. **Create Tenants:**
   - Logged in as super admin, go to Tenants collection
   - Create your first tenant (e.g., "Ftiaxesite.gr")
   - Add domains, colors, logo, etc.

7. **Create Tenant Admins:**
   - Create users with role "Tenant Admin"
   - Assign them to a tenant
   - They can now manage users and content for that tenant

8. **Create Editors:**
   - Create users with role "Editor"
   - Assign them to a tenant
   - They can create and edit content for that tenant

## Usage Notes

- **Slug Uniqueness**: Pages and Posts have globally unique slugs. If you need tenant-scoped slugs, you'll need to modify the validation or use a composite unique constraint.

- **Unique Tenant Relationships**: Header, Footer, and Homepage enforce one-per-tenant via `unique: true` on the tenant field.

- **Block System**: All blocks are shared across tenants. If you need tenant-specific blocks, create separate block collections.

- **Media**: Media files are publicly readable for frontend usage, but only authenticated users can upload/manage them based on tenant access.

## Future Enhancements

- Tenant-specific block libraries
- Slug scoping per tenant (composite unique constraints)
- Additional role types (e.g., viewer, contributor)
- Tenant-level feature flags
- API endpoints for tenant creation
- Tenant isolation at database level for enhanced security

