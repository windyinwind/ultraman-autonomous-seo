#!/bin/bash

# Target installation directory for AI Agent plugins
TARGET_DIR="$HOME/.gemini/config/plugins/ultraman-autonomous-seo"

echo "🚀 Installing Ultraman Autonomous SEO plugin..."

# Create the directory structure if it doesn't exist
mkdir -p "$TARGET_DIR/rules"
mkdir -p "$TARGET_DIR/skills/gsc-seo-audit"
mkdir -p "$TARGET_DIR/skills/seo-branch-workflow"
mkdir -p "$TARGET_DIR/skills/seo-render-verify"

# Copy files
cp plugin.json "$TARGET_DIR/"
cp rules/seo-workflow-rules.md "$TARGET_DIR/rules/"
cp skills/gsc-seo-audit/SKILL.md "$TARGET_DIR/skills/gsc-seo-audit/"
cp skills/seo-branch-workflow/SKILL.md "$TARGET_DIR/skills/seo-branch-workflow/"
cp skills/seo-render-verify/SKILL.md "$TARGET_DIR/skills/seo-render-verify/"

# Handle config.json - don't overwrite if it exists
if [ -f "$TARGET_DIR/config.json" ]; then
    echo "⚠️  Existing config.json found at $TARGET_DIR/config.json. Skipping config overwrite."
else
    echo "📝 Creating config.json from template..."
    cp config.example.json "$TARGET_DIR/config.json"
    echo "👉 Please edit $TARGET_DIR/config.json to customize it for your website."
fi

echo "✅ Ultraman Autonomous SEO plugin installed successfully!"
echo "To use it, ask your AI agent: 'Perform an SEO audit using Search Console data' or 'Verify SEO rendering'."
