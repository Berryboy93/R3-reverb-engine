#!/bin/bash

# R3V4 Reverb UI Codebase Audit
# Maps the entire reverb plugin interface structure, dependencies, and integration points
# Usage: bash audit-r3v4-reverb.sh [--apply-export] [--project-root /path/to/stable]

set -e

PROJECT_ROOT="${2:-.}"
APPLY_EXPORT="${1:---no-export}"
AUDIT_DIR="/tmp/r3v4-reverb-audit-$(date +%s)"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}R3V4 Reverb UI Codebase Audit${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Project Root: $PROJECT_ROOT"
echo "Audit Output: $AUDIT_DIR"
mkdir -p "$AUDIT_DIR"

# ============================================================================
# 1. COMPONENT DISCOVERY
# ============================================================================
echo -e "${YELLOW}[1/8] Searching for reverb-related components...${NC}"

REVERB_COMPONENTS=$(find "$PROJECT_ROOT" \
  -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -path "*/client/*" \
  ! -path "*/node_modules/*" \
  ! -path "*/.next/*" \
  ! -path "*/dist/*" \
  ! -path "*/.git/*" \
  | xargs grep -l "reverb\|Reverb\|REVERB\|space.*engine\|Space.*Engine" 2>/dev/null || echo "")

echo "$REVERB_COMPONENTS" | tee "$AUDIT_DIR/reverb-components.txt"
echo -e "${GREEN}✓ Found component files${NC}"

# ============================================================================
# 2. KNOB & CONTROL COMPONENTS
# ============================================================================
echo -e "${YELLOW}[2/8] Locating knob and control components...${NC}"

CONTROL_COMPONENTS=$(find "$PROJECT_ROOT" \
  -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.git/*" \
  | xargs grep -l "knob\|Knob\|Slider\|slider\|control\|Control" 2>/dev/null \
  | grep -i "component\|ui" | head -20 || echo "")

echo "$CONTROL_COMPONENTS" | tee "$AUDIT_DIR/control-components.txt"
echo -e "${GREEN}✓ Located control library${NC}"

# ============================================================================
# 3. VISUALIZER & 3D RENDERING
# ============================================================================
echo -e "${YELLOW}[3/8] Mapping visualizer and 3D libraries...${NC}"

# Search for three.js, babylon, p5, etc.
VISUALIZER_FILES=$(find "$PROJECT_ROOT" \
  -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.git/*" \
  | xargs grep -l "three\|THREE\|babylon\|p5\|canvas\|webgl\|WebGL" 2>/dev/null | head -20 || echo "")

echo "$VISUALIZER_FILES" | tee "$AUDIT_DIR/visualizer-files.txt"

# Check package.json for 3D deps
echo "" >> "$AUDIT_DIR/visualizer-files.txt"
echo "=== 3D Library Dependencies ===" >> "$AUDIT_DIR/visualizer-files.txt"
grep -r "three\|babylon\|p5\|pixi" "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/packages/*/package.json" 2>/dev/null || echo "No 3D libs found in package.json"
echo -e "${GREEN}✓ Identified 3D rendering stack${NC}"

# ============================================================================
# 4. STATE MANAGEMENT
# ============================================================================
echo -e "${YELLOW}[4/8] Auditing state management (Zustand, Redux, Context)...${NC}"

STATE_FILES=$(find "$PROJECT_ROOT/packages/client" \
  -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  | xargs grep -l "zustand\|Zustand\|create.*store\|Redux\|Context\|useContext" 2>/dev/null | head -20 || echo "")

echo "$STATE_FILES" | tee "$AUDIT_DIR/state-management.txt"

# Look for reverb-specific stores
echo "" >> "$AUDIT_DIR/state-management.txt"
echo "=== Reverb-Specific State ===" >> "$AUDIT_DIR/state-management.txt"
find "$PROJECT_ROOT" \
  -type f \( -name "*store*" -o -name "*state*" -o -name "*reducer*" \) \
  -path "*/client/*" \
  ! -path "*/node_modules/*" \
  | head -20 >> "$AUDIT_DIR/state-management.txt" || echo ""

echo -e "${GREEN}✓ Mapped state management patterns${NC}"

# ============================================================================
# 5. STYLING APPROACH
# ============================================================================
echo -e "${YELLOW}[5/8] Detecting styling methodology...${NC}"

{
  echo "=== CSS-in-JS / Styling Libraries ==="
  grep -r "styled-components\|emotion\|tailwind\|css-modules\|sass\|scss" \
    "$PROJECT_ROOT/packages/client/package.json" \
    "$PROJECT_ROOT/package.json" 2>/dev/null | grep -v "node_modules" || echo "Direct detection..."
  
  echo ""
  echo "=== CSS File Structure ==="
  find "$PROJECT_ROOT/packages/client" -type f \( -name "*.css" -o -name "*.scss" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" | head -30
  
  echo ""
  echo "=== Component Styling Pattern ==="
  find "$PROJECT_ROOT/packages/client" -type f -name "*.tsx" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" | xargs grep -l "className\|styled\|css\|style=" 2>/dev/null | head -10
} | tee "$AUDIT_DIR/styling-approach.txt"

echo -e "${GREEN}✓ Identified styling stack${NC}"

# ============================================================================
# 6. LAYOUT & STRUCTURE
# ============================================================================
echo -e "${YELLOW}[6/8] Mapping UI layout hierarchy...${NC}"

{
  echo "=== Main Layout Files ==="
  find "$PROJECT_ROOT/packages/client/src" -type f -name "*.tsx" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    | xargs grep -l "layout\|Layout\|container\|Container" 2>/dev/null | head -20
  
  echo ""
  echo "=== Reverb Plugin Container ==="
  grep -r "Reverb\|reverb\|REVERB" "$PROJECT_ROOT/packages/client/src" \
    -l --include="*.tsx" 2>/dev/null | head -10
} | tee "$AUDIT_DIR/layout-structure.txt"

echo -e "${GREEN}✓ Mapped UI hierarchy${NC}"

# ============================================================================
# 7. AUDIO INTEGRATION
# ============================================================================
echo -e "${YELLOW}[7/8] Locating audio processing and DAW integration...${NC}"

{
  echo "=== Audio Processing Files ==="
  find "$PROJECT_ROOT" \
    -type f \( -name "*audio*" -o -name "*daw*" -o -name "*synth*" -o -name "*processor*" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    -name "*.ts" | head -20
  
  echo ""
  echo "=== AudioContext / Web Audio API Usage ==="
  grep -r "AudioContext\|audioContext\|WebAudio\|audioData" \
    "$PROJECT_ROOT/packages/client/src" \
    -l --include="*.tsx" --include="*.ts" 2>/dev/null | head -20
  
  echo ""
  echo "=== Reverb Plugin Instantiation ==="
  grep -r "Reverb\|reverb" "$PROJECT_ROOT/packages/client/src" \
    --include="*.tsx" --include="*.ts" \
    -B2 -A2 2>/dev/null | head -50
} | tee "$AUDIT_DIR/audio-integration.txt"

echo -e "${GREEN}✓ Located audio integration points${NC}"

# ============================================================================
# 8. PROJECT STRUCTURE SNAPSHOT
# ============================================================================
echo -e "${YELLOW}[8/8] Creating codebase tree snapshot...${NC}"

{
  echo "=== Client Directory Structure ==="
  if [ -d "$PROJECT_ROOT/packages/client" ]; then
    find "$PROJECT_ROOT/packages/client/src" -type f \( -name "*.tsx" -o -name "*.ts" \) \
      ! -path "*/node_modules/*" \
      ! -path "*/dist/*" \
      | sort | sed 's|'"$PROJECT_ROOT"'||g'
  else
    echo "Client directory not found at packages/client"
  fi
} | tee "$AUDIT_DIR/directory-structure.txt"

# ============================================================================
# DEPENDENCY ANALYSIS
# ============================================================================
echo -e "${YELLOW}Analyzing dependencies...${NC}"

{
  echo "=== Package.json - Top Level ==="
  grep -A 50 '"dependencies"' "$PROJECT_ROOT/package.json" 2>/dev/null | head -30
  
  echo ""
  echo "=== Client Package.json ==="
  if [ -f "$PROJECT_ROOT/packages/client/package.json" ]; then
    grep -A 30 '"dependencies"' "$PROJECT_ROOT/packages/client/package.json"
  fi
} | tee "$AUDIT_DIR/dependencies.txt"

# ============================================================================
# GENERATE SUMMARY REPORT
# ============================================================================
echo -e "${YELLOW}Generating summary report...${NC}"

{
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║          R3V4 REVERB UI AUDIT REPORT                           ║"
  echo "║          Generated: $(date)                     ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  
  echo "REVERB COMPONENTS FOUND:"
  wc -l < "$AUDIT_DIR/reverb-components.txt"
  echo ""
  
  echo "CONTROL/KNOB COMPONENTS:"
  wc -l < "$AUDIT_DIR/control-components.txt"
  echo ""
  
  echo "STATE MANAGEMENT FILES:"
  wc -l < "$AUDIT_DIR/state-management.txt"
  echo ""
  
  echo "VISUALIZATION STACK:"
  wc -l < "$AUDIT_DIR/visualizer-files.txt"
  echo ""
  
  echo "KEY FINDINGS:"
  echo ""
  echo "1. REVERB COMPONENT ENTRY POINTS:"
  if [ -s "$AUDIT_DIR/reverb-components.txt" ]; then
    head -3 "$AUDIT_DIR/reverb-components.txt" | sed 's|^|   |'
  else
    echo "   [No reverb components found - search for 'ReverbPlugin' or 'SpaceEngine']"
  fi
  echo ""
  
  echo "2. STATE MANAGEMENT:"
  if grep -q "zustand" "$AUDIT_DIR/state-management.txt" 2>/dev/null; then
    echo "   ✓ Zustand detected"
  fi
  if grep -q "Redux" "$AUDIT_DIR/state-management.txt" 2>/dev/null; then
    echo "   ✓ Redux detected"
  fi
  if grep -q "Context" "$AUDIT_DIR/state-management.txt" 2>/dev/null; then
    echo "   ✓ React Context detected"
  fi
  echo ""
  
  echo "3. 3D VISUALIZATION:"
  if grep -q "three" "$AUDIT_DIR/visualizer-files.txt" 2>/dev/null; then
    echo "   ✓ Three.js detected"
  fi
  if grep -q "babylon" "$AUDIT_DIR/visualizer-files.txt" 2>/dev/null; then
    echo "   ✓ Babylon.js detected"
  fi
  echo ""
  
  echo "4. STYLING:"
  if grep -q "tailwind" "$AUDIT_DIR/styling-approach.txt" 2>/dev/null; then
    echo "   ✓ Tailwind CSS"
  fi
  if grep -q "styled" "$AUDIT_DIR/styling-approach.txt" 2>/dev/null; then
    echo "   ✓ Styled Components or Emotion"
  fi
  echo ""
  
  echo "NEXT STEPS:"
  echo "   1. Review reverb-components.txt for entry points"
  echo "   2. Examine the main Reverb/SpaceEngine component"
  echo "   3. Map state management pattern (Zustand, Redux, etc.)"
  echo "   4. Identify knob/slider component implementations"
  echo "   5. Locate visualizer canvas integration"
  echo ""
  echo "AUDIT FILES:"
  ls -lh "$AUDIT_DIR"/ | awk '{print "   " $9}' | tail -n +2
  
} | tee "$AUDIT_DIR/SUMMARY.txt"

# ============================================================================
# EXPORT RESULTS
# ============================================================================
if [ "$APPLY_EXPORT" = "--apply-export" ]; then
  echo ""
  echo -e "${BLUE}Exporting audit results to ~/r3v4-reverb-audit/...${NC}"
  mkdir -p ~/r3v4-reverb-audit
  cp -r "$AUDIT_DIR"/* ~/r3v4-reverb-audit/
  echo -e "${GREEN}✓ Results exported to ~/r3v4-reverb-audit/${NC}"
fi

# ============================================================================
# FINAL OUTPUT
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Audit Complete${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Full report available at: $AUDIT_DIR"
echo ""
echo "Quick commands to explore:"
echo "  cat $AUDIT_DIR/SUMMARY.txt"
echo "  cat $AUDIT_DIR/reverb-components.txt"
echo "  cat $AUDIT_DIR/state-management.txt"
echo "  cat $AUDIT_DIR/styling-approach.txt"
echo ""
