#!/usr/bin/env node
/**
 * SEO Autopilot — installer (cross-platform: Windows / macOS / Linux)
 * Installs a canonical copy, wires up the agents we can wire up automatically,
 * and prints honest, copy-paste steps for the rest.
 *   Custom location: TARGET_DIR=/custom/path node install.js
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const NAME       = 'seo-autopilot';
const SRC        = __dirname;
const HOME       = os.homedir();
const TARGET_DIR = process.env.TARGET_DIR || path.join(HOME, '.config', NAME);
const SKILLS     = ['gsc-seo-audit', 'seo-branch-workflow', 'seo-render-verify'];

const cp = (src, dest) => { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); };
const cpDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? cpDir(s, d) : cp(s, d);
  }
};

try {
  console.log('🛫 Installing SEO Autopilot…');
  console.log(`📂 Canonical location: ${TARGET_DIR}`);

  // 1. Canonical install
  cpDir(path.join(SRC, 'skills'),         path.join(TARGET_DIR, 'skills'));
  cpDir(path.join(SRC, 'rules'),          path.join(TARGET_DIR, 'rules'));
  cpDir(path.join(SRC, 'docs'),           path.join(TARGET_DIR, 'docs'));
  cpDir(path.join(SRC, '.claude-plugin'), path.join(TARGET_DIR, '.claude-plugin'));
  for (const f of ['AGENTS.md', 'plugin.json', 'config.example.json', 'LICENSE']) {
    cp(path.join(SRC, f), path.join(TARGET_DIR, f));
  }

  // config.json — never overwrite
  const configDest = path.join(TARGET_DIR, 'config.json');
  if (fs.existsSync(configDest)) {
    console.log('⚠️  Keeping existing config.json');
  } else {
    cp(path.join(SRC, 'config.example.json'), configDest);
    console.log(`📝 Created ${configDest} (edit it, or use a per-project .seo-config.json)`);
  }

  // 2. Claude Code — personal skills (these actually load)
  if (fs.existsSync(path.join(HOME, '.claude'))) {
    for (const s of SKILLS) cp(path.join(SRC, 'skills', s, 'SKILL.md'), path.join(HOME, '.claude', 'skills', s, 'SKILL.md'));
    console.log('  ✅ Claude Code — installed 3 skills to ~/.claude/skills/ (restart Claude to load)');
  }

  // 3. Gemini CLI — skills dir (if present)
  if (fs.existsSync(path.join(HOME, '.gemini'))) {
    for (const s of SKILLS) cp(path.join(SRC, 'skills', s, 'SKILL.md'), path.join(HOME, '.gemini', 'skills', s, 'SKILL.md'));
    console.log('  ✅ Gemini CLI — copied skills to ~/.gemini/skills/');
  }

  const line = '──────────────────────────────────────────────────────────────────────────';
  console.log(`\n✅ Installed.\n\n${line}`);
  console.log('EVERY OTHER AGENT (Codex, Cursor, Windsurf, Aider, Zed, …) — 1 step:');
  console.log('  Copy AGENTS.md into the root of the WEBSITE repo you want optimized:');
  console.log(`      cp "${path.join(TARGET_DIR, 'AGENTS.md')}" /path/to/your/website/AGENTS.md`);
  console.log('  These agents read AGENTS.md automatically and gain the full workflow.\n');
  console.log('REQUIRED — connect Google Search Console (the data source):');
  console.log(`  Follow: ${path.join(TARGET_DIR, 'docs', 'gsc-mcp-setup.md')}   (~10 min, one time)\n`);
  console.log('RECOMMENDED — for render verification, connect the Chrome DevTools MCP:');
  console.log('  claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest');
  console.log('  (or the equivalent mcpServers entry for your agent)\n');
  console.log('Then ask your agent: "Audit my SEO using Search Console data and optimize it."');
  console.log(line);
} catch (err) {
  console.error('❌ Installation failed:', err);
  process.exit(1);
}
