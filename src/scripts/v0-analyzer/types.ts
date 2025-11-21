/**
 * Type definitions for V0 → Payload Block Mapping Engine
 */

export interface ComponentNode {
  name: string
  props: Record<string, any>
  children: ComponentNode[]
  jsx: string
  imports: ImportStatement[]
  filePath: string
}

export interface ImportStatement {
  source: string
  default?: string
  named?: string[]
  isTypeOnly?: boolean
}

export interface DetectedPattern {
  type: BlockType
  confidence: number
  metadata: PatternMetadata
  props: Record<string, PropInfo>
  children: ComponentNode[]
}

export interface PatternMetadata {
  hasBackgroundImage?: boolean
  hasTitle?: boolean
  hasSubtitle?: boolean
  hasButtons?: boolean
  hasImages?: boolean
  hasText?: boolean
  hasForm?: boolean
  hasVideo?: boolean
  hasMap?: boolean
  isRepeated?: boolean
  itemCount?: number
  layout?: LayoutInfo
  animation?: AnimationInfo
  responsive?: ResponsiveInfo
}

export interface PropInfo {
  name: string
  type: PropType
  required: boolean
  defaultValue?: any
  description?: string
}

export type PropType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'url'
  | 'image'
  | 'array'
  | 'object'
  | 'component'
  | 'richText'
  | 'html'

export type BlockType =
  | 'hero'
  | 'imageGallery'
  | 'richText'
  | 'imageText'
  | 'cardGrid'
  | 'featureList'
  | 'faq'
  | 'tabs'
  | 'video'
  | 'slider'
  | 'ctaBanner'
  | 'testimonials'
  | 'logoCloud'
  | 'pricingTable'
  | 'contactForm'
  | 'map'
  | 'navigation'
  | 'footer'
  | 'gridLayout'
  | 'rawHtml'
  | 'genericContentBlock'

export interface LayoutInfo {
  type: 'tailwind' | 'css' | 'custom'
  breakpoints?: {
    base?: string[]
    sm?: string[]
    md?: string[]
    lg?: string[]
    xl?: string[]
    '2xl'?: string[]
  }
  grid?: {
    baseCols?: number
    smCols?: number
    mdCols?: number
    lgCols?: number
    xlCols?: number
  }
  flexDirection?: {
    base?: 'row' | 'column'
    md?: 'row' | 'column'
    lg?: 'row' | 'column'
  }
}

export interface AnimationInfo {
  enabled: boolean
  engine: 'none' | 'framerMotion' | 'css' | 'gsap'
  config?: {
    type: string
    initial?: Record<string, any>
    animate?: Record<string, any>
    exit?: Record<string, any>
    whileInView?: Record<string, any>
    transition?: Record<string, any>
    classes?: string[]
    timeline?: boolean
    scrollTrigger?: boolean
    rawConfig?: Record<string, any>
  }
}

export interface ScrollRevealInfo {
  enabled: boolean
  trigger: 'viewportEnter' | 'viewportCenter' | 'viewportFullyVisible'
  once: boolean
  offset?: number
}

export interface ResponsiveInfo {
  variant: 'auto' | 'mobileOnly' | 'desktopOnly' | 'bothDifferent'
  mobileComponent?: string
  desktopComponent?: string
  useCustomLayout: boolean
  layoutConfig?: LayoutInfo
}

export interface RenderingHints {
  shouldAnimateOnScroll: boolean
  hasInitialAnimation: boolean
  hasHoverEffects: boolean
  heavyAnimation: boolean
  preferredViewport: 'fullWidth' | 'contained' | 'section'
  zIndexSensitive: boolean
}

export interface PayloadBlockSchema {
  slug: string
  label: string
  fields: PayloadField[]
  version?: number
  animation?: AnimationInfo
  scrollReveal?: ScrollRevealInfo
  layout?: ResponsiveInfo
  renderingHints?: RenderingHints
}

export interface PayloadField {
  name: string
  type: PayloadFieldType
  label?: string
  required?: boolean
  defaultValue?: any
  admin?: {
    description?: string
    condition?: string
    readOnly?: boolean
  }
  fields?: PayloadField[] // For groups/arrays
  relationTo?: string // For uploads
  options?: Array<{ label: string; value: string }> // For selects
  minRows?: number // For arrays
  maxRows?: number // For arrays
  validate?: string
}

export type PayloadFieldType =
  | 'text'
  | 'textarea'
  | 'richText'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'upload'
  | 'array'
  | 'group'
  | 'blocks'
  | 'json'
  | 'date'
  | 'email'
  | 'url'

export interface SyncJsonBlock {
  blockType: string
  blockLabel?: string
  [key: string]: any
}

export interface BlockMapping {
  componentName: string
  blockType: BlockType
  payloadSchema: PayloadBlockSchema
  syncJsonTemplate: SyncJsonBlock
  detectionMetadata: PatternMetadata
  version: number
}

export interface AnalyzerResult {
  component: ComponentNode
  detectedPattern: DetectedPattern
  payloadSchema: PayloadBlockSchema
  syncJsonTemplate: SyncJsonBlock
  mapping: BlockMapping
  errors: string[]
  warnings: string[]
}

