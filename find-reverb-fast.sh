#!/bin/bash

# Quick R3V4 Reverb Component Discovery
# Outputs just the file paths for immediate inspection

PROJECT_ROOT="${1:-.}"

echo "🔍 Searching for reverb components in: $PROJECT_ROOT"
echo ""

echo "📍 Reverb Components:"
find "$PROJECT_ROOT" -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  | xargs grep -l "reverb\|Reverb\|REVERB\|space.*engine\|Space.*Engine" 2>/dev/null \
  | sed 's|^|   |'

echo ""
echo "🎛️  Knob/Control Components:"
find "$PROJECT_ROOT/packages/client/src" -type f \( -name "*knob*" -o -name "*control*" -o -name "*slider*" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  2>/dev/null | sed 's|^|   |'

echo ""
echo "🗂️  Component Directories:"
find "$PROJECT_ROOT/packages/client/src" -type d -name "*component*" -o -name "*ui*" -o -name "*plugin*" \
  ! -path "*/node_modules/*" 2>/dev/null | head -10 | sed 's|^|   |'

echo ""
echo "📦 Package.json locations:"
find "$PROJECT_ROOT" -name "package.json" -path "*/packages/*" \
  ! -path "*/node_modules/*" | sed 's|^|   |'

echo ""
echo "💾 State store files:"
find "$PROJECT_ROOT/packages/client/src" -type f \( -name "*store*" -o -name "*state*" \) \
  ! -path "*/node_modules/*" | sed 's|^|   |'

echo ""
echo "📊 Visualizer/Canvas files:"
find "$PROJECT_ROOT" -type f \( -name "*visualiz*" -o -name "*canvas*" -o -name "*3d*" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" | sed 's|^|   |'
