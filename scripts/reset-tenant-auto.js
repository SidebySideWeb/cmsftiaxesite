#!/usr/bin/env node
/**
 * Node.js wrapper to reset tenant with automatic answers to migration prompts
 * Works cross-platform (Windows, Mac, Linux)
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
  console.error('Usage: node scripts/reset-tenant-auto.js --tenant <tenantCode>');
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];

console.log(`\n🔄 Resetting tenant: ${tenantCode}`);
console.log('📝 Pre-answering all migration prompts...\n');

// Answers for migration prompts
// ~ = rename (preserves data), + = create new column
// Order: answer each prompt as it appears
const answers = [
  '~', // content in cta_banner: rename description → content
  '~', // content in hero: rename subtitle → content
  '~', // content in card_grid: rename subtitle → content
  '~', // content in image_text: rename subtitle/description → content
  '~', // content in image_gallery: rename subtitle/description → content
  '~', // content in programs: rename subtitle/description → content
  '~', // content in sponsors: rename subtitle/description → content
  '~', // content in rich_text: rename subtitle/description → content
  '~', // button_label in hero: rename cta_label → button_label
  '~', // button_url in hero: rename cta_url → button_url
  '~', // button_label in other blocks: rename cta_label → button_label
  '~', // button_url in other blocks: rename cta_url → button_url
  'y', // Confirm migration if asked
].join('\n');

const child = spawn('pnpm', ['reset:tenant', '--tenant', tenantCode], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: resolve(__dirname, '..'),
});

// Write answers with delays to handle prompts
let answerIndex = 0;
const answerLines = answers.split('\n');

// Function to write next answer
const writeNextAnswer = () => {
  if (answerIndex < answerLines.length) {
    const answer = answerLines[answerIndex];
    child.stdin.write(answer + '\n');
    answerIndex++;
    // Wait 1 second before next answer (prompts need time to appear)
    setTimeout(writeNextAnswer, 1000);
  } else {
    child.stdin.end();
  }
};

// Start writing answers after a short delay
setTimeout(writeNextAnswer, 2000);

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Reset complete!\n');
  } else {
    console.log(`\n⚠️  Process exited with code ${code}\n`);
  }
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

