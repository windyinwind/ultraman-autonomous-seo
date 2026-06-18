#!/usr/bin/env node

/**
 * Ultraman Autonomous SEO — Universal Installer
 *
 * Works with: Gemini, Claude, Cursor, Windsurf, Copilot, and any AI coding agent.
 * Default install location: ~/.config/ultraman-autonomous-seo/  (XDG standard)
 * Override: TARGET_DIR=/custom/path node install.js
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const HOME       = os.homedir();
const TARGET_DIR = process.env.TARGET_DIR
  || path.join(HOME, '.config', 'ultraman-autonomous-seo');

console.log('🚀 Installing Ultraman Autonomous SEO plugin...');
console.log(`📂 Target directory: ${TARGET_DIR}`);

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

try {
  // Copy metadata and skills/rules
  copyFile(path.join(__dirname, 'plugin.json'),                                   path.join(TARGET_DIR, 'plugin.json'));
  copyFile(path.join(__dirname, 'rules', 'seo-workflow-rules.md'),                path.join(TARGET_DIR, 'rules', 'seo-workflow-rules.md'));
  copyFile(path.join(__dirname, 'skills', 'gsc-seo-audit',       'SKILL.md'),    path.join(TARGET_DIR, 'skills', 'gsc-seo-audit',       'SKILL.md'));
  copyFile(path.join(__dirname, 'skills', 'seo-branch-workflow',  'SKILL.md'),   path.join(TARGET_DIR, 'skills', 'seo-branch-workflow',  'SKILL.md'));
  copyFile(path.join(__dirname, 'skills', 'seo-render-verify',    'SKILL.md'),   path.join(TARGET_DIR, 'skills', 'seo-render-verify',    'SKILL.md'));

  // Copy config only if it does not already exist
  const configDest = path.join(TARGET_DIR, 'config.json');
  if (fs.existsSync(configDest)) {
    console.log(`\x1b[33m⚠️  Existing config.json found at ${configDest}. Skipping config overwrite.\x1b[0m`);
  } else {
    console.log('📝 Creating config.json from template...');
    copyFile(path.join(__dirname, 'config.example.json'), configDest);
    console.log(`\x1b[36m👉 Please edit ${configDest} to customize it for your website.\x1b[0m`);
  }

  console.log(`\n\x1b[32m✅ Plugin installed to: ${TARGET_DIR}\x1b[0m`);

  // ============================================================
  // Auto-detect installed AI agents and create symlinks so each
  // agent can find the plugin in its own expected plugin dir.
  // ============================================================
  console.log('\n🔍 Detecting installed AI agents...');

  /**
   * Agents to detect.
   * Each entry: { name, pluginDir }
   *   pluginDir — where THIS agent expects plugins to live.
   *   We check whether the *parent* of pluginDir exists (meaning
   *   the agent is installed) before creating the symlink.
   */
  const AGENTS = [
    // Gemini / Antigravity CLI  → ~/.gemini/config/plugins/<name>/
    { name: 'Gemini (Antigravity)', pluginDir: path.join(HOME, '.gemini',  'config', 'plugins', 'ultraman-autonomous-seo') },
    // Claude Code               → ~/.claude/plugins/<name>/
    { name: 'Claude Code',         pluginDir: path.join(HOME, '.claude',  'plugins', 'ultraman-autonomous-seo') },
    // Cursor                    → ~/.cursor/plugins/<name>/  (+ .cursor-plugin/plugin.json)
    { name: 'Cursor',              pluginDir: path.join(HOME, '.cursor',  'plugins', 'ultraman-autonomous-seo'), cursorPlugin: true },
    // Windsurf / Devin Desktop   → ~/.windsurf/plugins/<name>/
    { name: 'Windsurf / Devin Desktop', pluginDir: path.join(HOME, '.windsurf', 'plugins', 'ultraman-autonomous-seo') },
    // Generic fallback for any agent respecting ~/.agents/plugins/
    { name: 'Generic (~/.agents)', pluginDir: path.join(HOME, '.agents',  'plugins', 'ultraman-autonomous-seo') },
  ];

  for (const { name, pluginDir, cursorPlugin } of AGENTS) {
    const parentDir = path.dirname(pluginDir);
    if (!fs.existsSync(parentDir)) continue; // agent not installed — skip

    if (fs.existsSync(pluginDir)) {
      console.log(`  \x1b[32m✔ ${name}\x1b[0m — already linked at ${pluginDir}`);
    } else {
      fs.mkdirSync(parentDir, { recursive: true });
      fs.symlinkSync(TARGET_DIR, pluginDir, 'junction');
      // Cursor requires an extra .cursor-plugin/plugin.json inside the plugin dir
      if (cursorPlugin) {
        const cursorManifestDir = path.join(pluginDir, '.cursor-plugin');
        fs.mkdirSync(cursorManifestDir, { recursive: true });
        fs.copyFileSync(path.join(__dirname, 'plugin.json'), path.join(cursorManifestDir, 'plugin.json'));
        console.log(`  \x1b[36m🔗 ${name}\x1b[0m — symlink + .cursor-plugin/ created at ${pluginDir}`);
      } else {
        console.log(`  \x1b[36m🔗 ${name}\x1b[0m — symlink created at ${pluginDir}`);
      }
    }
  }

  console.log('\n\x1b[32m🎉 Done! Ask any AI agent: "Perform an SEO audit using Search Console data".\x1b[0m');
  console.log(`   To add another agent, symlink ${TARGET_DIR} into that agent's plugin directory.`);

} catch (err) {
  console.error('\x1b[31m❌ Installation failed:\x1b[0m', err);
  process.exit(1);
}
