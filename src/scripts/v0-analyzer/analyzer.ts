/**
 * Main V0 Component Analyzer
 * Orchestrates the entire analysis pipeline
 */

import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
// @ts-expect-error - @babel/traverse types are complex
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type {
  ComponentNode,
  ImportStatement,
  AnalyzerResult,
  DetectedPattern,
  PayloadBlockSchema,
  SyncJsonBlock,
  BlockMapping,
  AnimationInfo,
  ScrollRevealInfo,
  ResponsiveInfo,
} from './types'
import { detectPattern } from './patternDetectors'
import { generatePayloadSchema } from './payloadGenerator'
import { generateSyncJson } from './syncJsonGenerator'
import { detectFramerMotion, detectGSAP, detectCSSAnimations, detectScrollReveal } from './animationDetector'
import { extractTailwindResponsive, detectConditionalRendering, generateResponsiveInfo } from './responsiveDetector'

/**
 * Analyze a V0 component file
 */
export async function analyzeComponent(filePath: string): Promise<AnalyzerResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Read and parse file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const component = parseComponent(fileContent, filePath)

    if (!component) {
      throw new Error('Failed to parse component')
    }

    // Detect pattern
    const detectedPattern = detectPattern(component)

    // Detect animations
    const framerMotion = detectFramerMotion(component.jsx, component.imports)
    const gsap = detectGSAP(component.jsx, component.imports)
    const cssAnimations = detectCSSAnimations(component.jsx)
    const animation = framerMotion || gsap || cssAnimations || null

    // Detect scroll reveal
    const scrollReveal = detectScrollReveal(component.jsx, component.imports)

    // Detect responsive behavior
    const layout = extractTailwindResponsive(component.jsx)
    const conditional = detectConditionalRendering(component.jsx, component.imports)
    const responsive = generateResponsiveInfo(layout, conditional)

    // Generate Payload schema
    const payloadSchema = generatePayloadSchema(
      detectedPattern,
      component.name,
      animation,
      scrollReveal,
      responsive
    )

    // Generate sync JSON
    const syncJsonTemplate = generateSyncJson(detectedPattern, payloadSchema, component.name)

    // Create mapping
    const mapping: BlockMapping = {
      componentName: component.name,
      blockType: detectedPattern.type,
      payloadSchema,
      syncJsonTemplate,
      detectionMetadata: detectedPattern.metadata,
      version: 1,
    }

    return {
      component,
      detectedPattern,
      payloadSchema,
      syncJsonTemplate,
      mapping,
      errors,
      warnings,
    }
  } catch (error: any) {
    errors.push(error.message || String(error))
    throw error
  }
}

/**
 * Parse React component from file content
 */
function parseComponent(fileContent: string, filePath: string): ComponentNode | null {
  try {
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
    })

    let componentName = path.basename(filePath, path.extname(filePath))
    const imports: ImportStatement[] = []
    const props: Record<string, any> = {}
    const children: ComponentNode[] = []
    let jsx = ''

    traverse(ast, {
      ImportDeclaration(path) {
        const importStmt: ImportStatement = {
          source: path.node.source.value,
          named: [],
        }

        path.node.specifiers.forEach(spec => {
          if (t.isImportDefaultSpecifier(spec)) {
            importStmt.default = spec.local.name
          } else if (t.isImportSpecifier(spec)) {
            const imported = t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value
            importStmt.named?.push(imported)
          }
        })

        imports.push(importStmt)
      },

      ExportDefaultDeclaration(path) {
        if (t.isIdentifier(path.node.declaration)) {
          componentName = path.node.declaration.name
        } else if (t.isFunctionDeclaration(path.node.declaration)) {
          componentName = path.node.declaration.id?.name || componentName
        }
      },

      FunctionDeclaration(path) {
        if (path.node.id?.name === componentName || path.node.id?.name.includes('Component')) {
          // Extract props
          path.node.params.forEach(param => {
            if (t.isIdentifier(param)) {
              props[param.name] = undefined
            } else if (t.isObjectPattern(param)) {
              param.properties.forEach(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                  const key = prop.key.name
                  if (t.isIdentifier(prop.value)) {
                    props[key] = undefined
                  } else if (t.isLiteral(prop.value)) {
                    props[key] = prop.value.value
                  }
                }
              })
            }
          })

          // Extract JSX from function body
          path.traverse({
            JSXElement(path) {
              jsx += path.node.openingElement.name
            },
            ReturnStatement(path) {
              if (t.isJSXElement(path.node.argument)) {
                jsx = extractJSXString(path.node.argument)
              }
            },
          })
        }
      },

      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          (path.node.id.name === componentName || path.node.id.name.includes('Component'))
        ) {
          if (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init)) {
            const func = path.node.init
            if (t.isObjectPattern(func.params[0])) {
              func.params[0].properties.forEach(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                  props[prop.key.name] = undefined
                }
              })
            }
          }
        }
      },
    })

    // If JSX is empty, try to extract from entire file
    if (!jsx) {
      const jsxMatch = fileContent.match(/return\s*\(([\s\S]*?)\)\s*;?/i)
      if (jsxMatch) {
        jsx = jsxMatch[1]
      } else {
        jsx = fileContent
      }
    }

    return {
      name: componentName,
      props,
      children,
      jsx: jsx || fileContent,
      imports,
      filePath,
    }
  } catch (error) {
    console.error('Error parsing component:', error)
    return null
  }
}

/**
 * Extract JSX as string
 */
function extractJSXString(node: t.JSXElement): string {
  // Simplified JSX extraction - in production, use a proper JSX serializer
  return node.openingElement.name.toString()
}

/**
 * Analyze multiple component files
 */
export async function analyzeComponents(filePaths: string[]): Promise<AnalyzerResult[]> {
  const results: AnalyzerResult[] = []

  for (const filePath of filePaths) {
    try {
      const result = await analyzeComponent(filePath)
      results.push(result)
    } catch (error: any) {
      console.error(`Error analyzing ${filePath}:`, error)
      results.push({
        component: {
          name: path.basename(filePath),
          props: {},
          children: [],
          jsx: '',
          imports: [],
          filePath,
        },
        detectedPattern: {
          type: 'genericContentBlock',
          confidence: 0,
          metadata: {},
          props: {},
          children: [],
        },
        payloadSchema: {
          slug: 'generic',
          label: 'Generic Block',
          fields: [],
        },
        syncJsonTemplate: {
          blockType: 'genericContentBlock',
        },
        mapping: {
          componentName: path.basename(filePath),
          blockType: 'genericContentBlock',
          payloadSchema: {
            slug: 'generic',
            label: 'Generic Block',
            fields: [],
          },
          syncJsonTemplate: {
            blockType: 'genericContentBlock',
          },
          detectionMetadata: {},
          version: 1,
        },
        errors: [error.message || String(error)],
        warnings: [],
      })
    }
  }

  return results
}

