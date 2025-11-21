#!/usr/bin/env node
/**
 * Script to analyze V0 components and integrate with Payload
 */

import { analyzeComponents } from '../src/scripts/v0-analyzer/analyzer.js'
import { BlockRegistry, generatePayloadBlockFile } from '../src/scripts/v0-analyzer/blockRegistry.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input') !== -1 ? args.indexOf('--input') : args.indexOf('-i')
  const outputIdx = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o')
  const tenantIdx = args.indexOf('--tenant') !== -1 ? args.indexOf('--tenant') : args.indexOf('-t')

  const inputPath = inputIdx !== -1 && args[inputIdx + 1] ? args[inputIdx + 1] : null
  const outputPath = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : './generated-blocks'
  const tenant = tenantIdx !== -1 && args[tenantIdx + 1] ? args[tenantIdx + 1] : 'default'

  if (!inputPath) {
    console.error('❌ Error: --input is required')
    console.log('Usage: node scripts/analyze-v0-components.js --input <path> [--output <path>] [--tenant <name>]')
    process.exit(1)
  }

  console.log('\n🚀 V0 → Payload Block Mapping Engine\n')
  console.log(`📂 Input: ${inputPath}`)
  console.log(`📁 Output: ${outputPath}`)
  console.log(`🏢 Tenant: ${tenant}\n`)

  // Find component files
  const componentFiles = findComponentFiles(inputPath)
  
  if (componentFiles.length === 0) {
    console.error('❌ No component files found!')
    process.exit(1)
  }

  console.log(`📄 Found ${componentFiles.length} component file(s)\n`)

  // Create output directories
  const tenantDir = path.join(outputPath, tenant)
  const schemasDir = path.join(tenantDir, 'schemas')
  const syncJsonDir = path.join(tenantDir, 'sync-json')

  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true })
  }
  if (!fs.existsSync(syncJsonDir)) {
    fs.mkdirSync(syncJsonDir, { recursive: true })
  }

  // Initialize registry
  const registryPath = path.join(outputPath, 'block-registry.json')
  const blockRegistry = new BlockRegistry(registryPath)

  // Analyze components
  console.log('🔍 Analyzing components...\n')
  const results = await analyzeComponents(componentFiles)

  // Process results
  let successCount = 0
  let errorCount = 0
  const generatedBlocks = []

  for (const result of results) {
    try {
      const componentName = result.component.name
      const blockType = result.detectedPattern.type

      console.log(`\n📦 ${componentName}`)
      console.log(`   Type: ${blockType}`)
      console.log(`   Confidence: ${(result.detectedPattern.confidence * 100).toFixed(1)}%`)

      if (result.errors.length > 0) {
        console.log(`   ⚠️  Errors: ${result.errors.length}`)
        result.errors.forEach(e => console.log(`      - ${e}`))
        errorCount++
        continue
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

      generatedBlocks.push({
        blockType,
        schemaPath,
        componentName,
      })

      successCount++
    } catch (error) {
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

  // Generate integration instructions
  if (generatedBlocks.length > 0) {
    console.log('📝 Next steps:\n')
    console.log('1. Review generated schemas in:', schemasDir)
    console.log('2. Copy block files to src/blocks/')
    console.log('3. Import and add to src/blocks/index.ts')
    console.log('4. Run: pnpm generate:types\n')
  }
}

function findComponentFiles(dir) {
  const files = []
  
  if (!fs.existsSync(dir)) {
    return files
  }

  const stat = fs.statSync(dir)
  
  if (stat.isFile()) {
    if (dir.endsWith('.tsx') || dir.endsWith('.jsx') || dir.endsWith('.ts') || dir.endsWith('.js')) {
      return [dir]
    }
    return []
  }

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

main().catch(error => {
  console.error('❌ Fatal error:', error)
  if (error.stack) console.error(error.stack)
  process.exit(1)
})

