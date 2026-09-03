#!/bin/bash
set -e

# Install dependencies (non-interactive)
npm install --legacy-peer-deps

# Rebuild the AudioWorklet processor
npm run build:processor
