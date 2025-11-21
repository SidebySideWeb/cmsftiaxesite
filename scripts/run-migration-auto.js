#!/usr/bin/env node
/**
 * Wrapper script to run migration with automated responses
 * Answers: rename columns to preserve data
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const tenantIdx = args.indexOf('--tenant');
const pathIdx = args.indexOf('--path');

if (tenantIdx === -1 || !args[tenantIdx + 1]) {
  console.error('✗ Error: --tenant <code> is required');
  process.exit(1);
}

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error('✗ Error: --path <frontendSitePath> is required');
  process.exit(1);
}

const tenantCode = args[tenantIdx + 1];
const frontendSitePath = args[pathIdx + 1];

console.log('🚀 Running migration with automated responses...\n');
console.log('📝 Strategy: Rename columns to preserve existing data\n');

// Answers: ~ for rename (preserves data)
// For each prompt, we'll choose rename
const answers = ['~', '~', '~', '~', '~', '~', '~', '~', '~', '~'].join('\n');

const child = spawn('pnpm', ['import:frontend', '--tenant', tenantCode, '--path', frontendSitePath], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: resolve(__dirname, '..'),
});

// Send answers when prompts appear
let answerIndex = 0;
const answerLines = answers.split('\n');

// Write answers with delays to handle prompts
const writeAnswers = () => {
  answerLines.forEach((answer, index) => {
    setTimeout(() => {
      child.stdin.write(answer + '\n');
    }, index * 2000); // 2 second delay between answers
  });
};

// Start writing answers after a short delay
setTimeout(writeAnswers, 5000);

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

