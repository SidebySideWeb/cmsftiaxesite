#!/usr/bin/env node
/**
 * Script to prepare database (run migrations) then reset tenant
 * This handles the column renames first, then resets content
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const tenantIdx = args.indexOf('--tenant');

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error('✗ Error: --tenant <code> is required');
  console.error('Usage: node scripts/prepare-and-reset.js --tenant <tenantCode>');
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];

console.log(`\n🔄 Preparing database and resetting tenant: ${tenantCode}\n`);

// Step 1: Run Payload migrations (this will handle column renames)
console.log('📋 Step 1: Running Payload migrations...\n');
const migrateChild = spawn('pnpm', ['payload', 'migrate'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: resolve(__dirname, '..'),
});

// Answer migration confirmation
setTimeout(() => {
  migrateChild.stdin.write('y\n');
  migrateChild.stdin.end();
}, 1000);

migrateChild.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log('\n⚠️  Migration may have completed or was skipped\n');
  }
  
  // Step 2: Reset tenant content
  console.log('\n🗑️  Step 2: Resetting tenant content...\n');
  const resetChild = spawn('pnpm', ['reset:tenant', '--tenant', tenantCode], {
    stdio: ['inherit', 'inherit', 'inherit'],
    shell: true,
    cwd: resolve(__dirname, '..'),
  });

  resetChild.on('close', (resetCode) => {
    if (resetCode === 0) {
      console.log('\n✅ Reset complete! Ready to rebuild content.\n');
    } else {
      console.log(`\n⚠️  Reset completed with code ${resetCode}\n`);
    }
    process.exit(resetCode || 0);
  });

  resetChild.on('error', (err) => {
    console.error('Error during reset:', err);
    process.exit(1);
  });
});

migrateChild.on('error', (err) => {
  console.error('Error during migration:', err);
  process.exit(1);
});

