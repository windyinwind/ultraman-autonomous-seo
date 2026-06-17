#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const TARGET_DIR = path.join(HOME, '.gemini', 'config', 'plugins', 'ultraman-autonomous-seo');

console.log('🚀 Installing Ultraman Autonomous SEO plugin...');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

try {
  // Copy metadata and skills/rules
  copyFile(path.join(__dirname, 'plugin.json'), path.join(TARGET_DIR, 'plugin.json'));
  copyFile(path.join(__dirname, 'rules', 'seo-workflow-rules.md'), path.join(TARGET_DIR, 'rules', 'seo-workflow-rules.md'));
  copyFile(path.join(__dirname, 'skills', 'gsc-seo-audit', 'SKILL.md'), path.join(TARGET_DIR, 'skills', 'gsc-seo-audit', 'SKILL.md'));
  copyFile(path.join(__dirname, 'skills', 'seo-branch-workflow', 'SKILL.md'), path.join(TARGET_DIR, 'skills', 'seo-branch-workflow', 'SKILL.md'));
  copyFile(path.join(__dirname, 'skills', 'seo-render-verify', 'SKILL.md'), path.join(TARGET_DIR, 'skills', 'seo-render-verify', 'SKILL.md'));

  // Copy config if not exists
  const configDest = path.join(TARGET_DIR, 'config.json');
  if (fs.existsSync(configDest)) {
    console.log(`\x1b[33m⚠️  Existing config.json found at ${configDest}. Skipping config overwrite.\x1b[0m`);
  } else {
    console.log('📝 Creating config.json from template...');
    copyFile(path.join(__dirname, 'config.example.json'), configDest);
    console.log(`\x1b[36m👉 Please edit ${configDest} to customize it for your website.\x1b[0m`);
  }

  console.log('\x1b[32m✅ Ultraman Autonomous SEO plugin installed successfully!\x1b[0m');
  console.log('To use it, ask your AI agent: "Perform an SEO audit using Search Console data" or "Verify SEO rendering".');
} catch (err) {
  console.error('\x1b[31m❌ Installation failed:\x1b[0m', err);
  process.exit(1);
}
