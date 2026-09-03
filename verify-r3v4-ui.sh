#!/usr/bin/env bash
#
# R3V4 UI Verification Script — v2.2.0
# Verifies all patches applied correctly
#
set -euo pipefail

PROJECT_DIR="${1:-$HOME/projects/reverb-engine}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERR]${NC}  $1"; }

cd "$PROJECT_DIR"
ERRORS=0

echo "═══════════════════════════════════════════════════════════════════"
echo "              R3V4 UI PATCH VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════"

# 1. Check full-screen layout
echo ""
echo "▶ Layout Checks"
if grep -q "width: '100vw'" src/ui/R3V4Plugin.tsx; then
  log_ok "Full width (100vw)"
else
  log_err "Missing 100vw"
  ERRORS=$((ERRORS+1))
fi

if grep -q "height: '100vh'" src/ui/R3V4Plugin.tsx; then
  log_ok "Full height (100vh)"
else
  log_err "Missing 100vh"
  ERRORS=$((ERRORS+1))
fi

if grep -q "borderRadius: 0," src/ui/R3V4Plugin.tsx; then
  log_ok "No border radius (full bleed)"
else
  log_err "Border radius not removed"
  ERRORS=$((ERRORS+1))
fi

if grep -q "overflow: 'hidden'" src/ui/R3V4Plugin.tsx; then
  log_ok "Overflow hidden on root"
else
  log_warn "Overflow may cause scrollbars"
fi

# 2. Check CSS font loading
echo ""
echo "▶ CSS Checks"
if grep -q "display=swap" src/index.css; then
  log_ok "Font display=swap"
else
  log_err "Missing font swap"
  ERRORS=$((ERRORS+1))
fi

if grep -q "overflow: hidden" src/index.css; then
  log_ok "html/body overflow hidden"
else
  log_warn "Body overflow not hidden — may show scrollbars"
fi

# 3. Check canvas optimization
echo ""
echo "▶ Performance Checks"
if grep -q "dprRef" src/ui/components/Knob.tsx; then
  log_ok "Knob: dprRef for optimized resize"
else
  log_err "Knob missing dprRef"
  ERRORS=$((ERRORS+1))
fi

if grep -q "releasePointerCapture" src/ui/components/Knob.tsx; then
  log_ok "Knob: pointer capture release"
else
  log_err "Knob missing capture release"
  ERRORS=$((ERRORS+1))
fi

if grep -q "ResizeObserver" src/ui/components/SpaceCube.tsx; then
  log_ok "SpaceCube: ResizeObserver"
else
  log_err "SpaceCube missing ResizeObserver"
  ERRORS=$((ERRORS+1))
fi

# 4. Check accessibility
echo ""
echo "▶ Accessibility Checks"
if grep -q 'role="slider"' src/ui/components/Fader.tsx; then
  log_ok "Fader: ARIA slider role"
else
  log_err "Fader missing ARIA"
  ERRORS=$((ERRORS+1))
fi

if grep -q 'role="slider"' src/ui/components/StereoWidthSlider.tsx; then
  log_ok "Slider: ARIA slider role"
else
  log_err "Slider missing ARIA"
  ERRORS=$((ERRORS+1))
fi

if grep -q "tabIndex={0}" src/ui/components/Knob.tsx; then
  log_ok "Knob: keyboard focusable"
else
  log_warn "Knob not keyboard focusable"
fi

# 5. Check clip indicator
echo ""
echo "▶ Feature Checks"
if grep -q "clipRef" src/ui/components/Meter.tsx; then
  log_ok "Meter: clip detection"
else
  log_err "Meter missing clip detection"
  ERRORS=$((ERRORS+1))
fi

if grep -q "CLIP" src/ui/components/Meter.tsx; then
  log_ok "Meter: clip text indicator"
else
  log_err "Meter missing clip text"
  ERRORS=$((ERRORS+1))
fi

# 6. Check slider handle fix
echo ""
echo "▶ Interaction Checks"
if grep -q "translateX(-50%)" src/ui/components/StereoWidthSlider.tsx; then
  log_ok "Slider: centered handle transform"
else
  log_err "Slider handle not centered"
  ERRORS=$((ERRORS+1))
fi

if grep -q "Math.max(0, (value / 100)" src/ui/components/Fader.tsx; then
  log_ok "Fader: non-negative fill height"
else
  log_err "Fader fill may go negative"
  ERRORS=$((ERRORS+1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED — Patch verified successfully!${NC}"
else
  echo -e "${RED}✗ $ERRORS CHECK(S) FAILED — Review errors above${NC}"
fi
echo "═══════════════════════════════════════════════════════════════════"
exit $ERRORS
