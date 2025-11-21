/**
 * Responsive behavior detection for V0 components
 */

import type { LayoutInfo, ResponsiveInfo } from './types'

/**
 * Extract Tailwind responsive classes
 */
export function extractTailwindResponsive(jsx: string): LayoutInfo | null {
  const classRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/gi
  const classes: string[] = []
  let match

  while ((match = classRegex.exec(jsx)) !== null) {
    classes.push(...match[1].split(/\s+/))
  }

  if (classes.length === 0) {
    return null
  }

  const breakpoints: Record<string, string[]> = {
    base: [],
    sm: [],
    md: [],
    lg: [],
    xl: [],
    '2xl': [],
  }

  classes.forEach(cls => {
    if (cls.startsWith('sm:')) {
      breakpoints.sm.push(cls)
    } else if (cls.startsWith('md:')) {
      breakpoints.md.push(cls)
    } else if (cls.startsWith('lg:')) {
      breakpoints.lg.push(cls)
    } else if (cls.startsWith('xl:')) {
      breakpoints.xl.push(cls)
    } else if (cls.startsWith('2xl:')) {
      breakpoints['2xl'].push(cls)
    } else {
      breakpoints.base.push(cls)
    }
  })

  // Extract grid columns
  const gridCols: Record<string, number> = {}
  const gridColRegex = /grid-cols-(\d+)/i
  const smGridColRegex = /sm:grid-cols-(\d+)/i
  const mdGridColRegex = /md:grid-cols-(\d+)/i
  const lgGridColRegex = /lg:grid-cols-(\d+)/i
  const xlGridColRegex = /xl:grid-cols-(\d+)/i

  const allClasses = classes.join(' ')

  const baseMatch = allClasses.match(gridColRegex)
  if (baseMatch) gridCols.base = parseInt(baseMatch[1], 10)

  const smMatch = allClasses.match(smGridColRegex)
  if (smMatch) gridCols.sm = parseInt(smMatch[1], 10)

  const mdMatch = allClasses.match(mdGridColRegex)
  if (mdMatch) gridCols.md = parseInt(mdMatch[1], 10)

  const lgMatch = allClasses.match(lgGridColRegex)
  if (lgMatch) gridCols.lg = parseInt(lgMatch[1], 10)

  const xlMatch = allClasses.match(xlGridColRegex)
  if (xlMatch) gridCols.xl = parseInt(xlMatch[1], 10)

  // Extract flex direction
  const flexDirection: Record<string, 'row' | 'column'> = {}
  if (allClasses.includes('flex-col')) {
    flexDirection.base = 'column'
  } else if (allClasses.includes('flex-row')) {
    flexDirection.base = 'row'
  }

  if (allClasses.includes('md:flex-row')) {
    flexDirection.md = 'row'
  } else if (allClasses.includes('md:flex-col')) {
    flexDirection.md = 'column'
  }

  if (allClasses.includes('lg:flex-row')) {
    flexDirection.lg = 'row'
  } else if (allClasses.includes('lg:flex-col')) {
    flexDirection.lg = 'column'
  }

  const hasResponsive = Object.keys(breakpoints).some(
    key => key !== 'base' && breakpoints[key].length > 0
  ) || Object.keys(gridCols).length > 0 || Object.keys(flexDirection).length > 0

  if (!hasResponsive) {
    return null
  }

  return {
    type: 'tailwind',
    breakpoints: Object.keys(breakpoints).some(k => breakpoints[k].length > 0) ? breakpoints : undefined,
    grid: Object.keys(gridCols).length > 0 ? gridCols : undefined,
    flexDirection: Object.keys(flexDirection).length > 0 ? flexDirection : undefined,
  }
}

/**
 * Detect conditional mobile/desktop rendering
 */
export function detectConditionalRendering(jsx: string, imports: any[]): ResponsiveInfo | null {
  const hasUseMediaQuery = imports.some(
    imp => imp.named?.includes('useMediaQuery') || imp.default === 'useMediaQuery'
  )

  const hasIsMobile = jsx.includes('isMobile') || jsx.includes('isMobile ?')
  const hasIsDesktop = jsx.includes('isDesktop') || jsx.includes('isDesktop ?')
  const hasWidthCheck = jsx.includes('width <') || jsx.includes('width >') || jsx.includes('window.innerWidth')

  if (!hasUseMediaQuery && !hasIsMobile && !hasIsDesktop && !hasWidthCheck) {
    return null
  }

  // Extract component names
  const mobileMatch = jsx.match(/(?:isMobile|width\s*<\s*\d+)\s*\?\s*<(\w+)/i)
  const desktopMatch = jsx.match(/(?:isDesktop|width\s*>\s*\d+)\s*\?\s*<(\w+)/i)

  const mobileComponent = mobileMatch ? mobileMatch[1] : undefined
  const desktopComponent = desktopMatch ? desktopMatch[1] : undefined

  let variant: 'auto' | 'mobileOnly' | 'desktopOnly' | 'bothDifferent' = 'auto'

  if (mobileComponent && desktopComponent && mobileComponent !== desktopComponent) {
    variant = 'bothDifferent'
  } else if (mobileComponent && !desktopComponent) {
    variant = 'mobileOnly'
  } else if (desktopComponent && !mobileComponent) {
    variant = 'desktopOnly'
  }

  return {
    variant,
    mobileComponent,
    desktopComponent,
    useCustomLayout: false,
  }
}

/**
 * Generate responsive info from layout and conditional rendering
 */
export function generateResponsiveInfo(
  layout: LayoutInfo | null,
  conditional: ResponsiveInfo | null
): ResponsiveInfo {
  if (conditional) {
    return {
      ...conditional,
      useCustomLayout: !!layout,
      layoutConfig: layout || undefined,
    }
  }

  if (layout) {
    return {
      variant: 'auto',
      useCustomLayout: true,
      layoutConfig: layout,
    }
  }

  return {
    variant: 'auto',
    useCustomLayout: false,
  }
}

