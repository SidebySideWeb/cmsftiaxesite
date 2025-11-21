#!/usr/bin/env node
/**
 * CLI wrapper for V0 → Payload Block Mapping Engine
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { analyzeComponents } from './analyzer'
import { BlockRegistry, generatePayloadBlockFile } from './blockRegistry'
import type { AnalyzerResult } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface CLIOptions {
  input: string | string[]
  output?: string
  tenant?: string
  registry?: string
  verbose?: boolean
}

/**
 * Main CLI function
 */
export async function runCLI(options: CLIOptions): Promise<void> {
  const {
    input,
    output = './generated-blocks',
    tenant = 'default',
    registry = './block-registry.json',
    verbose = false,
  } = options

  console.log('\n🚀 V0 → Payload Block Mapping Engine\n')
  console.log(`📂 Input: ${Array.isArray(input) ? input.join(', ') : input}`)
  console.log(`📁 Output: ${output}`)
  console.log(`🏢 Tenant: ${tenant}`)
  console.log(`📋 Registry: ${registry}\n`)

  // Resolve input files
  const inputFiles = Array.isArray(input) ? input : [input]
  const resolvedFiles: string[] = []

  for (const file of inputFiles) {
    if (fs.existsSync(file)) {
      if (fs.statSync(file).isDirectory()) {
        // Find all component files in directory
        const files = findComponentFiles(file)
        resolvedFiles.push(...files)
      } else {
        resolvedFiles.push(file)
      }
    } else {
      console.warn(`⚠️  File not found: ${file}`)
    }
  }

  if (resolvedFiles.length === 0) {
    console.error('❌ No component files found!')
    process.exit(1)
  }

  console.log(`📄 Found ${resolvedFiles.length} component file(s)\n`)

  // Create output directory
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true })
  }

  // Initialize registry
  const blockRegistry = new BlockRegistry(registry)

  // Analyze components
  console.log('🔍 Analyzing components...\n')
  const results = await analyzeComponents(resolvedFiles)

  // Process results
  const tenantDir = path.join(output, tenant)
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true })
  }

  const schemasDir = path.join(tenantDir, 'schemas')
  const syncJsonDir = path.join(tenantDir, 'sync-json')

  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true })
  }
  if (!fs.existsSync(syncJsonDir)) {
    fs.mkdirSync(syncJsonDir, { recursive: true })
  }

  let successCount = 0
  let errorCount = 0

  for (const result of results) {
    try {
      const componentName = result.component.name
      const blockType = result.detectedPattern.type

      console.log(`\n📦 ${componentName}`)
      console.log(`   Type: ${blockType}`)
      console.log(`   Confidence: ${(result.detectedPattern.confidence * 100).toFixed(1)}%`)

      if (result.errors.length > 0) {
        console.log(`   ⚠️  Errors: ${result.errors.length}`)
        errorCount++
      }

      if (result.warnings.length > 0 && verbose) {
        console.log(`   ⚠️  Warnings: ${result.warnings.length}`)
        result.warnings.forEach(w => console.log(`      - ${w}`))
      }

      // Save Payload schema
      const schemaPath = path.join(schemasDir, `${blockType}.ts`)
      generatePayloadBlockFile(result.payloadSchema, schemaPath)
      console.log(`   ✅ Schema: ${schemaPath}`)

      // Register block
      blockRegistry.register(result.mapping, schemaPath)

      // Save sync JSON
      const syncJsonPath = path.join(syncJsonDir, `${componentName}.json`)
      fs.writeFileSync(
        syncJsonPath,
        JSON.stringify(result.syncJsonTemplate, null, 2)
      )
      console.log(`   ✅ Sync JSON: ${syncJsonPath}`)

      successCount++
    } catch (error: any) {
      console.error(`   ❌ Error processing ${result.component.name}:`, error.message)
      errorCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary')
  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📋 Registry entries: ${blockRegistry.getAll().length}`)
  console.log(`\n📁 Output directory: ${tenantDir}`)
  console.log('='.repeat(60) + '\n')
}

/**
 * Find component files in directory
 */
function findComponentFiles(dir: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...findComponentFiles(fullPath))
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') ||
        entry.name.endsWith('.jsx') ||
        entry.name.endsWith('.ts') ||
        entry.name.endsWith('.js'))
    ) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    input: [],
  } as CLIOptions

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--input':
      case '-i':
        options.input = args[++i] || ''
        break
      case '--output':
      case '-o':
        options.output = args[++i]
        break
      case '--tenant':
      case '-t':
        options.tenant = args[++i]
        break
      case '--registry':
      case '-r':
        options.registry = args[++i]
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
      default:
        if (!options.input) {
          options.input = arg
        }
    }
  }

  if (!options.input) {
    console.error('❌ Error: Input file or directory is required')
    printHelp()
    process.exit(1)
  }

  return options
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
V0 → Payload Block Mapping Engine

Usage:
  v0-analyzer [options] <input>

Options:
  -i, --input <path>     Input file or directory (required)
  -o, --output <path>    Output directory (default: ./generated-blocks)
  -t, --tenant <name>    Tenant name (default: default)
  -r, --registry <path>  Registry file path (default: ./block-registry.json)
  -v, --verbose          Verbose output
  -h, --help             Show this help message

Examples:
  v0-analyzer --input ./components --output ./blocks --tenant kalitechnia
  v0-analyzer -i Hero.tsx -o ./generated -t mytenant -v
`)
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs()
  runCLI(options).catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

