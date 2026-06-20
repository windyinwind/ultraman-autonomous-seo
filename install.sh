#!/usr/bin/env bash
# =============================================================================
# SEO Autopilot — installer (macOS / Linux)
# Installs a canonical copy, wires up the agents we can wire up automatically,
# and prints honest, copy-paste steps for the rest. Cross-platform Node version:
# `node install.js`.
#   Custom location: TARGET_DIR=/custom/path ./install.sh
# =============================================================================
set -euo pipefail

NAME="seo-autopilot"
SRC="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${TARGET_DIR:-$HOME/.config/$NAME}"

echo "🛫 Installing SEO Autopilot…"
echo "📂 Canonical location: $TARGET_DIR"

# --- 1. Canonical install -----------------------------------------------------
mkdir -p "$TARGET_DIR"
cp -R "$SRC/skills" "$SRC/rules" "$SRC/docs" "$TARGET_DIR/"
cp "$SRC/AGENTS.md" "$SRC/plugin.json" "$SRC/config.example.json" "$SRC/LICENSE" "$TARGET_DIR/"
cp -R "$SRC/.claude-plugin" "$TARGET_DIR/" 2>/dev/null || true

# config.json — never overwrite an existing one
if [ -f "$TARGET_DIR/config.json" ]; then
  echo "⚠️  Keeping existing config.json"
else
  cp "$SRC/config.example.json" "$TARGET_DIR/config.json"
  echo "📝 Created $TARGET_DIR/config.json (edit it, or use a per-project .seo-config.json)"
fi

SKILLS=(gsc-seo-audit seo-branch-workflow seo-render-verify)

# --- 2. Claude Code: personal skills (these actually load) --------------------
if [ -d "$HOME/.claude" ]; then
  for s in "${SKILLS[@]}"; do
    mkdir -p "$HOME/.claude/skills/$s"
    cp "$SRC/skills/$s/SKILL.md" "$HOME/.claude/skills/$s/SKILL.md"
  done
  echo "  ✅ Claude Code — installed 3 skills to ~/.claude/skills/ (restart Claude to load)"
fi

# --- 3. Gemini CLI: skills dir (if present) -----------------------------------
if [ -d "$HOME/.gemini" ]; then
  for s in "${SKILLS[@]}"; do
    mkdir -p "$HOME/.gemini/skills/$s"
    cp "$SRC/skills/$s/SKILL.md" "$HOME/.gemini/skills/$s/SKILL.md"
  done
  echo "  ✅ Gemini CLI — copied skills to ~/.gemini/skills/"
fi

echo ""
echo "✅ Installed."
echo ""
echo "──────────────────────────────────────────────────────────────────────────"
echo "EVERY OTHER AGENT (Codex, Cursor, Windsurf, Aider, Zed, …) — 1 step:"
echo "  Copy AGENTS.md into the root of the WEBSITE repo you want optimized:"
echo "      cp \"$TARGET_DIR/AGENTS.md\" /path/to/your/website/AGENTS.md"
echo "  These agents read AGENTS.md automatically and gain the full workflow."
echo ""
echo "REQUIRED — connect Google Search Console (the data source):"
echo "  Follow: $TARGET_DIR/docs/gsc-mcp-setup.md   (~10 min, one time)"
echo ""
echo "RECOMMENDED — for render verification, connect the Chrome DevTools MCP:"
echo "  claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest"
echo "  (or the equivalent mcpServers entry for your agent)"
echo ""
echo "Then ask your agent:  \"Audit my SEO using Search Console data and optimize it.\""
echo "──────────────────────────────────────────────────────────────────────────"
