/**
 * TypeScript interfaces for sync data schemas
 * These interfaces define the structure of JSON files used for auto-syncing
 * tenant data from Next.js sites into Payload CMS.
 */

/**
 * Site configuration schema
 * Defines the tenant/project configuration
 */
export interface SiteSchema {
  /** Tenant identifier (slug) */
  tenant: string
  /** Display name of the project/site */
  projectName: string
  /** Array of domains associated with this tenant */
  domains: string[]
}

/**
 * Top bar configuration
 */
export interface TopBarSchema {
  /** Whether the top bar is enabled */
  enabled: boolean
  /** Text content to display in the top bar */
  text: string
}

/**
 * Header configuration schema
 */
export interface HeaderSchema {
  /** Path to logo image */
  logo: string
  /** Top bar configuration */
  topBar: TopBarSchema
  /** Reference to navigation menu (menu title or slug) */
  navigationMenu: string
}

/**
 * Footer menu item
 */
export interface FooterMenuItem {
  /** Menu title */
  title: string
  /** Menu items (references to navigation menu items) */
  items: unknown[]
}

/**
 * Social media link
 */
export interface SocialLink {
  /** Platform name (e.g., "facebook", "instagram") */
  platform: string
  /** URL to the social media profile */
  url: string
}

/**
 * Footer configuration schema
 */
export interface FooterSchema {
  /** Copyright text */
  copyrightText: string
  /** Array of footer menu sections */
  footerMenus: FooterMenuItem[]
  /** Array of social media links */
  socialLinks: SocialLink[]
}

/**
 * Navigation menu item
 */
export interface MenuItem {
  /** Display label for the menu item */
  label: string
  /** Reference to page slug */
  page: string
  /** Optional: Link type (internal/external) */
  type?: 'internal' | 'external'
  /** Optional: External URL (if type is external) */
  url?: string
  /** Optional: Whether to open in new tab */
  openInNewTab?: boolean
}

/**
 * Navigation menu schema
 */
export interface MenuSchema {
  /** Menu title/name */
  menuTitle: string
  /** Array of menu items */
  items: MenuItem[]
}

/**
 * SEO configuration
 */
export interface SEOSchema {
  /** SEO title (max 60 characters) */
  title: string
  /** SEO description (max 160 characters) */
  description: string
}

/**
 * Page configuration schema
 */
export interface PageSchema {
  /** Page title */
  title: string
  /** URL-friendly slug */
  slug: string
  /** Array of content blocks (will be filled later from v0 blocks) */
  blocks: unknown[]
  /** SEO configuration */
  seo: SEOSchema
}

/**
 * Complete tenant sync data structure
 * Represents all data needed to sync a tenant from JSON files
 */
export interface TenantSyncData {
  /** Site configuration */
  site: SiteSchema
  /** Header configuration */
  header: HeaderSchema
  /** Footer configuration */
  footer: FooterSchema
  /** Navigation menu configuration */
  menu: MenuSchema
  /** Pages configuration */
  pages: {
    [pageSlug: string]: PageSchema
  }
}

