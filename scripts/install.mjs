#!/usr/bin/env node

import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillRoot = join(__dirname, '..');
const targetDir = join(process.cwd(), '.claude', 'skills', 'zapier-connector-skill');

console.log(`
 ╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔═══╗╔╦╗╔═══╗╔═══╗
 ╔═══╝╠═══╣╠═══╝║   ║║   ║║   ║║║║║   ║║    
 ╚═══╝╩   ╩╩    ╚═══╝╚═══╝╩   ╩╩ ╩╩   ╩╚═══╝
`);

// Detect if user passed a custom path
const customPath = process.argv[2];
const dest = customPath || targetDir;

if (existsSync(dest)) {
  console.log(`⚠️  Directory already exists: ${dest}`);
  console.log('   Overwriting...\n');
}

mkdirSync(dest, { recursive: true });

// Copy skill files
const filesToCopy = ['SKILL.md', 'README.md'];
const dirsToCopy = ['references', 'examples'];

for (const file of filesToCopy) {
  cpSync(join(skillRoot, file), join(dest, file));
}

for (const dir of dirsToCopy) {
  const src = join(skillRoot, dir);
  if (existsSync(src)) {
    cpSync(src, join(dest, dir), { recursive: true });
  }
}

console.log(`✅ Skill installed to: ${dest}\n`);
console.log('Next steps:');
console.log('  1. Create a zapier-config.json in your project root');
console.log('  2. Ask Claude Code: "Generate a Zapier integration using the zapier-connector-skill"');
console.log('');