#!/bin/bash
set -e

echo "🔧 R3V4 Reverb Engine v1.0 — Production Build"
echo "=============================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Type checking..."
npx tsc --noEmit

# Build plugin (ES + UMD)
echo "🏗️  Building plugin bundle..."
npm run build:plugin

# Build standalone
echo "🏗️  Building standalone app..."
npm run build:standalone

# Package for distribution
echo "📦 Packaging..."
mkdir -p dist/release
cp -r dist/plugin dist/release/
cp -r dist/standalone dist/release/
cp docs/R3V4-Manual.md dist/release/ 2>/dev/null || true

echo "✅ Build complete: dist/release/"
