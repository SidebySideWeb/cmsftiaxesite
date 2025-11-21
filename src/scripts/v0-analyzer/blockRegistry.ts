/**
 * Block Registry System
 * Manages block versions and schema changes
 */

import fs from 'fs'
import path from 'path'
import type {
  BlockMapping,
  PayloadBlockSchema,
} from './types'

interface RegistryEntry {
  componentName: string
  blockType: string
  version: number
  schemaPath: string
  lastModified: Date
  changelog: string[]
}

export class BlockRegistry {
  private registryPath: string
  private registry: Map<string, RegistryEntry> = new Map()

  constructor(registryPath: string = './block-registry.json') {
    this.registryPath = registryPath
    this.loadRegistry()
  }

  /**
   * Register a new block mapping
   */
  register(mapping: BlockMapping, schemaPath: string): void {
    const key = `${mapping.componentName}-${mapping.blockType}`
    const existing = this.registry.get(key)

    if (existing) {
      // Check if schema has changed
      const hasChanged = this.detectSchemaChanges(existing.schemaPath, mapping.payloadSchema)

      if (hasChanged) {
        // Increment version
        const newVersion = existing.version + 1
        const newSchemaPath = this.createVersionedSchemaPath(schemaPath, newVersion)

        this.registry.set(key, {
          componentName: mapping.componentName,
          blockType: mapping.blockType,
          version: newVersion,
          schemaPath: newSchemaPath,
          lastModified: new Date(),
          changelog: [
            ...existing.changelog,
            `Version ${newVersion}: Schema updated`,
          ],
        })

        // Save old version
        this.saveVersionedSchema(existing.schemaPath, existing.version)
      } else {
        // Update last modified
        this.registry.set(key, {
          ...existing,
          lastModified: new Date(),
        })
      }
    } else {
      // New registration
      this.registry.set(key, {
        componentName: mapping.componentName,
        blockType: mapping.blockType,
        version: 1,
        schemaPath,
        lastModified: new Date(),
        changelog: ['Version 1: Initial registration'],
      })
    }

    this.saveRegistry()
  }

  /**
   * Get registry entry
   */
  get(componentName: string, blockType: string): RegistryEntry | undefined {
    const key = `${componentName}-${blockType}`
    return this.registry.get(key)
  }

  /**
   * Get all entries
   */
  getAll(): RegistryEntry[] {
    return Array.from(this.registry.values())
  }

  /**
   * Detect if schema has changed
   */
  private detectSchemaChanges(oldSchemaPath: string, newSchema: PayloadBlockSchema): boolean {
    try {
      if (!fs.existsSync(oldSchemaPath)) {
        return true
      }

      const oldSchema = JSON.parse(fs.readFileSync(oldSchemaPath, 'utf-8'))

      // Compare field counts
      if (oldSchema.fields?.length !== newSchema.fields?.length) {
        return true
      }

      // Compare field names
      const oldFieldNames = (oldSchema.fields || []).map((f: any) => f.name).sort()
      const newFieldNames = (newSchema.fields || []).map((f: any) => f.name).sort()

      if (JSON.stringify(oldFieldNames) !== JSON.stringify(newFieldNames)) {
        return true
      }

      // Compare field types
      for (let i = 0; i < oldFieldNames.length; i++) {
        const oldField = oldSchema.fields.find((f: any) => f.name === oldFieldNames[i])
        const newField = newSchema.fields.find((f: any) => f.name === newFieldNames[i])

        if (oldField?.type !== newField?.type) {
          return true
        }
      }

      return false
    } catch (error) {
      // If we can't compare, assume it changed
      return true
    }
  }

  /**
   * Create versioned schema path
   */
  private createVersionedSchemaPath(originalPath: string, version: number): string {
    if (version === 1) {
      return originalPath
    }

    const dir = path.dirname(originalPath)
    const basename = path.basename(originalPath, path.extname(originalPath))
    const ext = path.extname(originalPath)

    return path.join(dir, `${basename}.v${version}${ext}`)
  }

  /**
   * Save versioned schema
   */
  private saveVersionedSchema(schemaPath: string, version: number): void {
    try {
      if (fs.existsSync(schemaPath)) {
        const versionedPath = this.createVersionedSchemaPath(schemaPath, version)
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
        fs.writeFileSync(versionedPath, schemaContent)
      }
    } catch (error) {
      console.error('Error saving versioned schema:', error)
    }
  }

  /**
   * Load registry from disk
   */
  private loadRegistry(): void {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'))
        data.forEach((entry: any) => {
          const key = `${entry.componentName}-${entry.blockType}`
          this.registry.set(key, {
            ...entry,
            lastModified: new Date(entry.lastModified),
          })
        })
      }
    } catch (error) {
      console.warn('Error loading registry, starting fresh:', error)
    }
  }

  /**
   * Save registry to disk
   */
  private saveRegistry(): void {
    try {
      const data = Array.from(this.registry.values())
      fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error saving registry:', error)
    }
  }
}

/**
 * Generate Payload block file from schema
 */
export function generatePayloadBlockFile(
  schema: PayloadBlockSchema,
  outputPath: string
): void {
  const blockCode = generateBlockCode(schema)
  fs.writeFileSync(outputPath, blockCode)
}

/**
 * Generate TypeScript code for Payload block
 */
function generateBlockCode(schema: PayloadBlockSchema): string {
  const fieldsCode = generateFieldsCode(schema.fields, 2)

  return `import type { Block } from 'payload'

export const ${toPascalCase(schema.slug)}Block: Block = {
  slug: '${schema.slug}',
  labels: {
    singular: '${schema.label}',
    plural: '${schema.label}s',
  },
  fields: [
${fieldsCode}
  ],
}
`
}

/**
 * Generate TypeScript code for fields
 */
function generateFieldsCode(fields: any[], indent: number = 0): string {
  const indentStr = ' '.repeat(indent)
  return fields
    .map(field => {
      let code = `${indentStr}{\n`
      code += `${indentStr}  name: '${field.name}',\n`
      code += `${indentStr}  type: '${field.type}',\n`

      if (field.label) {
        code += `${indentStr}  label: '${field.label}',\n`
      }

      if (field.required) {
        code += `${indentStr}  required: true,\n`
      }

      if (field.defaultValue !== undefined) {
        code += `${indentStr}  defaultValue: ${JSON.stringify(field.defaultValue)},\n`
      }

      if (field.relationTo) {
        code += `${indentStr}  relationTo: '${field.relationTo}',\n`
      }

      if (field.options) {
        code += `${indentStr}  options: [\n`
        field.options.forEach((opt: any) => {
          code += `${indentStr}    { label: '${opt.label}', value: '${opt.value}' },\n`
        })
        code += `${indentStr}  ],\n`
      }

      if (field.minRows !== undefined) {
        code += `${indentStr}  minRows: ${field.minRows},\n`
      }

      if (field.maxRows !== undefined) {
        code += `${indentStr}  maxRows: ${field.maxRows},\n`
      }

      if (field.fields && field.fields.length > 0) {
        code += `${indentStr}  fields: [\n`
        code += generateFieldsCode(field.fields, indent + 4)
        code += `${indentStr}  ],\n`
      }

      if (field.admin) {
        code += `${indentStr}  admin: {\n`
        if (field.admin.description) {
          code += `${indentStr}    description: '${field.admin.description}',\n`
        }
        code += `${indentStr}  },\n`
      }

      code += `${indentStr}},`
      return code
    })
    .join('\n')
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

