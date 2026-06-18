#!/bin/bash

# =============================================================================
# Ultraman Autonomous SEO — Universal Installer
# Works with: Gemini, Claude, Cursor, Codex, Copilot, and any AI coding agent.
# Default install: ~/.config/ultraman-autonomous-seo/ (XDG standard)
# Override:  TARGET_DIR=/custom/path ./install.sh
# =============================================================================

# --- Resolve install target ---
TARGET_DIR="${TARGET_DIR:-$HOME/.config/ultraman-autonomous-seo}"

echo "🚀 Installing Ultraman Autonomous SEO plugin..."
echo "📂 Target directory: $TARGET_DIR"

# Create the directory structure
mkdir -p "$TARGET_DIR/rules"
mkdir -p "$TARGET_DIR/skills/gsc-seo-audit"
mkdir -p "$TARGET_DIR/skills/seo-branch-workflow"
mkdir -p "$TARGET_DIR/skills/seo-render-verify"

# Copy plugin files
cp plugin.json "$TARGET_DIR/"
cp rules/seo-workflow-rules.md "$TARGET_DIR/rules/"
cp skills/gsc-seo-audit/SKILL.md "$TARGET_DIR/skills/gsc-seo-audit/"
cp skills/seo-branch-workflow/SKILL.md "$TARGET_DIR/skills/seo-branch-workflow/"
cp skills/seo-render-verify/SKILL.md "$TARGET_DIR/skills/seo-render-verify/"

# Handle config.json — never overwrite an existing one
if [ -f "$TARGET_DIR/config.json" ]; then
    echo "⚠️  Existing config.json found at $TARGET_DIR/config.json. Skipping config overwrite."
else
    echo "📝 Creating config.json from template..."
    cp config.example.json "$TARGET_DIR/config.json"
    echo "👉 Please edit $TARGET_DIR/config.json to customize it for your website."
fi

echo ""
echo "✅ Plugin installed to: $TARGET_DIR"

# =============================================================================
# Auto-detect installed AI agents and create symlinks so each agent can find
# the plugin in its own expected configuration directory.
# =============================================================================
echo ""
echo "🔍 Detecting installed AI agents..."

link_plugin() {
  local AGENT_NAME="$1"
  local AGENT_PLUGIN_DIR="$2"
  if [ -d "$(dirname "$AGENT_PLUGIN_DIR")" ]; then
    if [ -e "$AGENT_PLUGIN_DIR" ]; then
      echo "  ✔ $AGENT_NAME — already linked at $AGENT_PLUGIN_DIR"
    else
      ln -s "$TARGET_DIR" "$AGENT_PLUGIN_DIR"
      echo "  🔗 $AGENT_NAME — symlink created at $AGENT_PLUGIN_DIR"
    fi
  fi
}

# Gemini / Antigravity CLI  → ~/.gemini/config/plugins/<name>/
link_plugin "Gemini (Antigravity)" "$HOME/.gemini/config/plugins/ultraman-autonomous-seo"

# Claude Code              → ~/.claude/plugins/<name>/
link_plugin "Claude Code"          "$HOME/.claude/plugins/ultraman-autonomous-seo"

# Cursor                   → ~/.cursor/plugins/<name>/  (+.cursor-plugin/plugin.json)
if [ -d "$HOME/.cursor" ]; then
  CURSOR_PLUGIN_DIR="$HOME/.cursor/plugins/ultraman-autonomous-seo"
  if [ -e "$CURSOR_PLUGIN_DIR" ]; then
    echo "  ✔ Cursor — already linked at $CURSOR_PLUGIN_DIR"
  else
    ln -s "$TARGET_DIR" "$CURSOR_PLUGIN_DIR"
    # Cursor also needs .cursor-plugin/plugin.json inside the plugin dir
    mkdir -p "$CURSOR_PLUGIN_DIR/.cursor-plugin"
    cp plugin.json "$CURSOR_PLUGIN_DIR/.cursor-plugin/plugin.json"
    echo "  🔗 Cursor — symlink + .cursor-plugin/ created at $CURSOR_PLUGIN_DIR"
  fi
fi

# Windsurf (rebranded Devin Desktop) → ~/.windsurf/plugins/<name>/
link_plugin "Windsurf / Devin Desktop" "$HOME/.windsurf/plugins/ultraman-autonomous-seo"

# Generic fallback for any agent that respects ~/.agents/plugins/
link_plugin "Generic (~/.agents)"  "$HOME/.agents/plugins/ultraman-autonomous-seo"

echo ""
echo "🎉 Done! Ask any AI agent: 'Perform an SEO audit using Search Console data'."
echo "   To add support for another agent, symlink $TARGET_DIR into that agent's plugin directory."
