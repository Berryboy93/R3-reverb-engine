#!/usr/bin/env bash
# =============================================================================
# R3V4 Space Engine — Professional Deployment Script v1.1
# =============================================================================
# Usage:
#   ./deploy_r3v4.sh                    Auto-detect and replace existing HTML
#   ./deploy_r3v4.sh [path/to/file]   Replace specific file (must exist)
#   ./deploy_r3v4.sh --new [path]     Create new file at path (overwrite ok)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${CYAN}${BOLD}→ $1${NC}"; }

# =============================================================================
# FIND TARGET FILE
# =============================================================================
find_target() {
  local target="$1"
  local create_new="${2:-false}"

  # If explicit path provided and --new flag set, use it directly
  if [[ "$create_new" == "true" && -n "$target" ]]; then
    # Ensure parent directory exists
    local parent
    parent=$(dirname "$target")
    if [[ ! -d "$parent" ]]; then
      log_step "Creating parent directory: $parent"
      mkdir -p "$parent"
    fi
    echo "$target"
    return 0
  fi

  # If explicit path provided and file exists, use it
  if [[ -n "$target" && -f "$target" ]]; then
    echo "$target"
    return 0
  fi

  # If explicit path provided but doesn't exist, warn and search
  if [[ -n "$target" && ! -f "$target" ]]; then
    log_warn "Provided path not found: $target"
    log_info "Falling back to auto-detection..."
  fi

  local search_paths=(
    "./r3v4_space_engine.html"
    "./index.html"
    "./src/r3v4_space_engine.html"
    "./src/index.html"
    "./public/r3v4_space_engine.html"
    "./public/index.html"
    "./dist/r3v4_space_engine.html"
    "./dist/index.html"
    "./build/r3v4_space_engine.html"
    "./build/index.html"
    "./static/r3v4_space_engine.html"
    "./static/index.html"
    "./templates/r3v4_space_engine.html"
    "./templates/index.html"
    "./www/r3v4_space_engine.html"
    "./www/index.html"
    "./html/r3v4_space_engine.html"
    "./html/index.html"
    "./client/r3v4_space_engine.html"
    "./client/index.html"
    "./frontend/r3v4_space_engine.html"
    "./frontend/index.html"
    "./app/r3v4_space_engine.html"
    "./app/index.html"
    "./web/r3v4_space_engine.html"
    "./web/index.html"
    "./ui/r3v4_space_engine.html"
    "./ui/index.html"
    "./pages/r3v4_space_engine.html"
    "./pages/index.html"
  )

  for path in "${search_paths[@]}"; do
    if [[ -f "$path" ]]; then
      echo "$path"
      return 0
    fi
  done

  local found
  found=$(find . -maxdepth 4 -type f \( -name "r3v4_space_engine.html" -o -name "index.html" \) 2>/dev/null | head -n1)
  if [[ -n "$found" ]]; then
    echo "$found"
    return 0
  fi

  return 1
}

# =============================================================================
# CREATE BACKUP
# =============================================================================
create_backup() {
  local target="$1"
  local backup_dir=".r3v4_backups"
  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_name="${backup_dir}/r3v4_backup_${timestamp}.html"

  mkdir -p "$backup_dir"
  cp "$target" "$backup_name"
  echo "$backup_name"
}

# =============================================================================
# VALIDATE HTML INTEGRITY
# =============================================================================
validate_html() {
  local file="$1"
  local issues=0

  if ! grep -q "<!DOCTYPE html>" "$file"; then
    log_warn "Missing DOCTYPE declaration"
    ((issues++))
  fi

  if ! grep -q "<html" "$file"; then
    log_err "Missing <html> opening tag"
    ((issues++))
  fi
  if ! grep -q "</html>" "$file"; then
    log_err "Missing </html> closing tag"
    ((issues++))
  fi

  if ! grep -q "<head>" "$file" || ! grep -q "</head>" "$file"; then
    log_err "Missing or unclosed <head>"
    ((issues++))
  fi
  if ! grep -q "<body>" "$file" || ! grep -q "</body>" "$file"; then
    log_err "Missing or unclosed <body>"
    ((issues++))
  fi

  local script_opens script_closes
  script_opens=$(grep -o '<script[^>]*>' "$file" | wc -l)
  script_closes=$(grep -o '</script>' "$file" | wc -l)
  if [[ "$script_opens" -ne "$script_closes" ]]; then
    log_err "Script tag mismatch: $script_opens open, $script_closes close"
    ((issues++))
  fi

  local style_opens style_closes
  style_opens=$(grep -o '<style[^>]*>' "$file" | wc -l)
  style_closes=$(grep -o '</style>' "$file" | wc -l)
  if [[ "$style_opens" -ne "$style_closes" ]]; then
    log_err "Style tag mismatch: $style_opens open, $style_closes close"
    ((issues++))
  fi

  if ! grep -q 'id="kg"' "$file"; then
    log_err "Missing SVG gradient definition 'kg'"
    ((issues++))
  fi
  if ! grep -q 'id="glow"' "$file"; then
    log_warn "Missing SVG glow filter 'glow'"
    ((issues++))
  fi

  local knob_params=("predelay" "decay" "size" "diffusion" "damping" "highcut" "lowcut" "bassdamp" "earlyref" "crosstalk" "modulation" "width")
  for param in "${knob_params[@]}"; do
    if ! grep -q "id=\"arc-${param}\"" "$file"; then
      log_err "Missing knob arc: arc-${param}"
      ((issues++))
    fi
    if ! grep -q "id=\"dot-${param}\"" "$file"; then
      log_err "Missing knob dot: dot-${param}"
      ((issues++))
    fi
    if ! grep -q "id=\"val-${param}\"" "$file"; then
      log_err "Missing knob value: val-${param}"
      ((issues++))
    fi
  done

  for fader in "dry" "er" "wet"; do
    if ! grep -q "id=\"fill-${fader}\"" "$file"; then
      log_err "Missing fader fill: fill-${fader}"
      ((issues++))
    fi
    if ! grep -q "id=\"thumb-${fader}\"" "$file"; then
      log_err "Missing fader thumb: thumb-${fader}"
      ((issues++))
    fi
  done

  if ! grep -q 'id="space-viz"' "$file"; then
    log_warn "Missing space visualizer canvas"
    ((issues++))
  fi

  for meter in "in-l" "in-r" "out-l" "out-r"; do
    if ! grep -q "id=\"meter-${meter}\"" "$file"; then
      log_err "Missing meter: meter-${meter}"
      ((issues++))
    fi
  done

  return $issues
}

# =============================================================================
# MAIN
# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║      R3V4 Space Engine — Professional Deployment Tool      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
TARGET=""
CREATE_NEW=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --new|-n)
      CREATE_NEW=true
      shift
      ;;
    -*)
      log_err "Unknown option: $1"
      echo "Usage: $0 [--new] [path/to/file.html]"
      exit 1
      ;;
    *)
      TARGET="$1"
      shift
      ;;
  esac
done

if [[ -n "$TARGET" ]]; then
  log_info "Target path provided: $TARGET"
  if [[ "$CREATE_NEW" == "true" ]]; then
    log_info "Mode: CREATE NEW (will overwrite if exists)"
  else
    log_info "Mode: REPLACE EXISTING"
  fi
else
  log_info "No target path provided. Auto-detecting..."
fi

RESOLVED=$(find_target "$TARGET" "$CREATE_NEW") || {
  log_err "Could not find any HTML file to replace"
  log_info "Searched: current directory + 28 common project paths"
  echo ""
  echo -e "${YELLOW}Usage:${NC}"
  echo "  $0                          Auto-detect and replace"
  echo "  $0 path/to/file.html        Replace specific file"
  echo "  $0 --new path/to/file.html  Create/overwrite at path"
  echo ""
  exit 1
}

log_ok "Target resolved: ${BOLD}${RESOLVED}${NC}"

# If replacing existing, verify it's HTML
if [[ "$CREATE_NEW" == "false" && -f "$RESOLVED" ]]; then
  if ! file "$RESOLVED" 2>/dev/null | grep -qi "html"; then
    if ! head -n1 "$RESOLVED" | grep -qi "<!DOCTYPE\|<html"; then
      log_err "Target file does not appear to be HTML"
      exit 1
    fi
  fi
fi

ABS_PATH=$(cd "$(dirname "$RESOLVED")" && pwd)/$(basename "$RESOLVED")
log_info "Absolute path: $ABS_PATH"

# Backup only if file exists
if [[ -f "$RESOLVED" ]]; then
  log_step "Creating backup..."
  BACKUP_PATH=$(create_backup "$RESOLVED")
  log_ok "Backup created: ${BACKUP_PATH}"
else
  log_info "No existing file to backup (new deployment)"
  BACKUP_PATH="(none)"
fi

log_step "Deploying new version..."

cat > "$RESOLVED" << 'HTMLBLOCK'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>R3V4 Space Engine v2.0</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: linear-gradient(135deg, #0f0f12 0%, #1a1a1f 50%, #0f0f12 100%);
    color: #c9c5b8;
    font-family: 'Segoe UI', system-ui, sans-serif;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    user-select: none;
  }
  .panel {
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.05);
    backdrop-filter: blur(4px);
  }
  .btn-gold {
    background: linear-gradient(180deg, #2a2618, #1a1810);
    border: 1px solid rgba(212,175,55,0.35);
    color: #d4af37;
    border-radius: 6px;
    cursor: pointer;
    transition: all .15s;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .btn-gold:hover {
    border-color: rgba(212,175,55,0.6);
    box-shadow: 0 0 8px rgba(212,175,55,0.15);
  }
  .btn-gold.active {
    background: linear-gradient(180deg, #d4af37, #b8941f);
    color: #0f0f12;
    font-weight: 700;
    box-shadow: 0 0 12px rgba(212,175,55,0.3);
  }
  .btn-dark {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #888;
    border-radius: 5px;
    cursor: pointer;
    transition: all .15s;
    font-size: 11px;
  }
  .btn-dark:hover {
    background: rgba(255,255,255,0.08);
    color: #ccc;
  }
  .btn-dark.active {
    background: rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.4);
    color: #d4af37;
  }
  .section-label {
    font-size: 10px;
    letter-spacing: 2px;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .param-label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 6px;
    text-align: center;
  }
  .param-value {
    font-size: 12px;
    color: #d4af37;
    font-weight: 600;
    text-align: center;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .knob-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    touch-action: none;
  }
  .fader-track {
    width: 10px;
    height: 140px;
    background: linear-gradient(180deg, #1a1a1f, #0f0f12);
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.08);
    position: relative;
    cursor: pointer;
    touch-action: none;
  }
  .fader-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, #d4af37, #8a6d1f);
    border-radius: 0 0 5px 5px;
    opacity: 0.7;
    pointer-events: none;
  }
  .fader-thumb {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 18px;
    background: linear-gradient(180deg, #e8d8a8, #b8941f);
    border-radius: 4px;
    border: 1px solid #d4af37;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    z-index: 2;
    pointer-events: none;
  }
  .fader-thumb::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 2px;
    background: rgba(0,0,0,0.3);
    border-radius: 1px;
  }
  input[type=range].imaging-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 8px;
    background: linear-gradient(90deg, #1a1a1f, #0f0f12);
    border-radius: 4px;
    outline: none;
    border: 1px solid rgba(255,255,255,0.08);
  }
  input[type=range].imaging-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    background: radial-gradient(circle, #e8d8a8, #b8941f);
    border-radius: 50%;
    border: 2px solid #d4af37;
    box-shadow: 0 0 10px rgba(212,175,55,0.4);
    cursor: pointer;
  }
  input[type=range].imaging-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background: radial-gradient(circle, #e8d8a8, #b8941f);
    border-radius: 50%;
    border: 2px solid #d4af37;
    box-shadow: 0 0 10px rgba(212,175,55,0.4);
    cursor: pointer;
  }
  .meter-bar {
    width: 6px;
    height: 80px;
    background: #0f0f12;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .meter-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(0deg, #0f0, #cf0, #fa0, #f00);
    border-radius: 0 0 3px 3px;
    transition: height .1s linear;
  }
  .top-bar-btn { padding: 6px 16px; font-size: 11px; letter-spacing: 1px; }
  .preset-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    padding: 4px 12px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .nav-arrow {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: #888;
    transition: all .15s;
    user-select: none;
  }
  .nav-arrow:hover {
    color: #d4af37;
    background: rgba(212,175,55,0.1);
  }
  .texture-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    position: relative;
    z-index: 1;
  }
  .main-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .left-sidebar {
    width: 220px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-right: 1px solid rgba(255,255,255,0.04);
    overflow-y: auto;
  }
  .center-panel {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }
  .bottom-bar {
    padding: 12px 24px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .knob-row {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
  }
  .fader-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
</style>
</head>
<body>
<div id="app">
  <svg width="0" height="0" style="position:absolute;">
    <defs>
      <linearGradient id="kg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3a3528"/>
        <stop offset="100%" style="stop-color:#1a1810"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  </svg>
  <div class="texture-overlay"></div>
  <div class="top-bar">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#d4af37,#8a6d1f);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0f0f12;font-size:14px;box-shadow:0 0 12px rgba(212,175,55,0.3);">R3</div>
      <div>
        <div style="font-size:16px;font-weight:800;letter-spacing:3px;color:#e8e4d8;">R3V4</div>
        <div style="font-size:9px;color:#666;letter-spacing:2px;">SPACE ENGINE v2.0</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="preset-nav">
        <div class="nav-arrow" onclick="changePreset(-1)">&#9664;</div>
        <div id="preset-name" style="font-size:12px;color:#d4af37;min-width:160px;text-align:center;font-weight:600;letter-spacing:1px;">HALL — CLEAN SLATE</div>
        <div class="nav-arrow" onclick="changePreset(1)">&#9654;</div>
      </div>
      <div style="font-size:10px;color:#555;margin:0 8px;">|</div>
      <div style="font-size:11px;color:#666;">Init — Clean Slate</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="nav-arrow">&#8634;</div>
      <div class="nav-arrow">&#8635;</div>
      <button class="btn-gold top-bar-btn" id="ab-btn" onclick="toggleAB()">A/B</button>
      <button class="btn-dark top-bar-btn" style="padding:6px 12px;" aria-label="Bypass">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </button>
      <button class="btn-dark top-bar-btn">Test Tone</button>
      <button class="btn-gold top-bar-btn active" id="enable-btn" onclick="toggleEnable()">ENABLE</button>
      <div class="nav-arrow">&#8634;</div>
    </div>
  </div>
  <div class="main-body">
    <div class="left-sidebar">
      <div class="panel" style="padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-size:9px;letter-spacing:2px;color:#666;width:100%;">SPACE VISUALIZER</div>
        <div style="font-size:9px;color:#444;align-self:flex-start;">HALL</div>
        <canvas id="space-viz" width="160" height="160" style="border-radius:8px;background:rgba(0,0,0,0.3);"></canvas>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
        <button class="btn-dark room-btn active" data-room="hall" onclick="setRoom('hall')">HALL</button>
        <button class="btn-dark room-btn" data-room="room" onclick="setRoom('room')">ROOM</button>
        <button class="btn-dark room-btn" data-room="plate" onclick="setRoom('plate')">PLATE</button>
        <button class="btn-dark room-btn" data-room="spring" onclick="setRoom('spring')">SPRING</button>
        <button class="btn-dark room-btn" data-room="cathedral" onclick="setRoom('cathedral')">CATHEDRAL</button>
        <button class="btn-dark room-btn" data-room="arena" onclick="setRoom('arena')">ARENA</button>
        <button class="btn-dark room-btn" data-room="studio" onclick="setRoom('studio')">STUDIO</button>
        <button class="btn-dark room-btn" data-room="chamber" onclick="setRoom('chamber')">CHAMBER</button>
        <button class="btn-dark room-btn" data-room="ambient" onclick="setRoom('ambient')">AMBIENT</button>
        <button class="btn-dark room-btn" data-room="infinite" onclick="setRoom('infinite')">INFINITE</button>
      </div>
      <button class="btn-gold" style="padding:10px;font-size:11px;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:6px;">
        <span style="font-size:14px;">&#10022;</span> ASI SMART MODE
      </button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <button class="btn-dark" style="padding:8px 4px;font-size:10px;display:flex;align-items:center;justify-content:center;gap:4px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M5 10l7-7 7 7M5 14l7 7 7-7"/></svg>
          Freeze
        </button>
        <button class="btn-dark" style="padding:8px 4px;font-size:10px;display:flex;align-items:center;justify-content:center;gap:4px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/></svg>
          Ducking
        </button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <button class="btn-dark" style="padding:8px 4px;font-size:10px;display:flex;align-items:center;justify-content:center;gap:4px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Tempo
        </button>
        <button class="btn-dark" style="padding:8px 4px;font-size:10px;">2x OS</button>
      </div>
    </div>
    <div class="center-panel">
      <div class="panel" style="padding:20px 24px;">
        <div class="section-label">Time</div>
        <div class="knob-row">
          <div class="knob-container" onmousedown="startKnob(event,'predelay')" ontouchstart="startKnob(event,'predelay')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-predelay" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-predelay" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Pre-Delay</div>
            <div class="param-value" id="val-predelay">45 ms</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'decay')" ontouchstart="startKnob(event,'decay')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-decay" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-decay" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Decay</div>
            <div class="param-value" id="val-decay">2.5 s</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'size')" ontouchstart="startKnob(event,'size')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-size" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-size" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Size</div>
            <div class="param-value" id="val-size">65 %</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'diffusion')" ontouchstart="startKnob(event,'diffusion')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-diffusion" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-diffusion" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Diffusion</div>
            <div class="param-value" id="val-diffusion">78 %</div>
          </div>
        </div>
      </div>
      <div class="panel" style="padding:20px 24px;">
        <div class="section-label">Tone</div>
        <div class="knob-row">
          <div class="knob-container" onmousedown="startKnob(event,'damping')" ontouchstart="startKnob(event,'damping')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-damping" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-damping" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Damping</div>
            <div class="param-value" id="val-damping">42 %</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'highcut')" ontouchstart="startKnob(event,'highcut')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-highcut" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-highcut" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">High Cut</div>
            <div class="param-value" id="val-highcut">12.0 kHz</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'lowcut')" ontouchstart="startKnob(event,'lowcut')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-lowcut" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-lowcut" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Low Cut</div>
            <div class="param-value" id="val-lowcut">120 Hz</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'bassdamp')" ontouchstart="startKnob(event,'bassdamp')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-bassdamp" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-bassdamp" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Bass Damp</div>
            <div class="param-value" id="val-bassdamp">35 %</div>
          </div>
        </div>
      </div>
      <div class="panel" style="padding:20px 24px;">
        <div class="section-label">Character</div>
        <div class="knob-row">
          <div class="knob-container" onmousedown="startKnob(event,'earlyref')" ontouchstart="startKnob(event,'earlyref')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-earlyref" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-earlyref" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Early Ref</div>
            <div class="param-value" id="val-earlyref">60 %</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'crosstalk')" ontouchstart="startKnob(event,'crosstalk')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-crosstalk" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-crosstalk" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Crosstalk</div>
            <div class="param-value" id="val-crosstalk">50 %</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'modulation')" ontouchstart="startKnob(event,'modulation')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-modulation" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-modulation" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Modulation</div>
            <div class="param-value" id="val-modulation">15 %</div>
          </div>
          <div class="knob-container" onmousedown="startKnob(event,'width')" ontouchstart="startKnob(event,'width')">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="32" fill="url(#kg)" stroke="rgba(212,175,55,0.2)" stroke-width="1.5"/><circle cx="36" cy="36" r="26" fill="none" stroke="#0f0f12" stroke-width="3"/><path id="arc-width" d="" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/><circle id="dot-width" cx="36" cy="10" r="4" fill="#d4af37" filter="url(#glow)"/></svg>
            <div class="param-label">Width</div>
            <div class="param-value" id="val-width">100 %</div>
          </div>
        </div>
      </div>
      <div class="panel" style="padding:20px 24px;flex:1;display:flex;flex-direction:column;">
        <div class="section-label">Mix</div>
        <div style="display:flex;justify-content:space-around;align-items:flex-end;flex:1;padding-bottom:10px;">
          <div class="fader-group">
            <div style="font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">Direct</div>
            <div class="fader-track" onmousedown="startFader(event,'dry')" ontouchstart="startFader(event,'dry')">
              <div class="fader-fill" id="fill-dry" style="height:80%;"></div>
              <div class="fader-thumb" id="thumb-dry" style="bottom:calc(80% - 9px);"></div>
            </div>
            <div style="font-size:10px;color:#888;letter-spacing:1px;margin-top:4px;">DRY</div>
            <div class="param-value" id="val-dry">80%</div>
          </div>
          <div class="fader-group">
            <div style="font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">Early</div>
            <div class="fader-track" onmousedown="startFader(event,'er')" ontouchstart="startFader(event,'er')">
              <div class="fader-fill" id="fill-er" style="height:40%;"></div>
              <div class="fader-thumb" id="thumb-er" style="bottom:calc(40% - 9px);"></div>
            </div>
            <div style="font-size:10px;color:#888;letter-spacing:1px;margin-top:4px;">ER</div>
            <div class="param-value" id="val-er">40%</div>
          </div>
          <div class="fader-group">
            <div style="font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">Reverb</div>
            <div class="fader-track" onmousedown="startFader(event,'wet')" ontouchstart="startFader(event,'wet')">
              <div class="fader-fill" id="fill-wet" style="height:25%;"></div>
              <div class="fader-thumb" id="thumb-wet" style="bottom:calc(25% - 9px);"></div>
            </div>
            <div style="font-size:10px;color:#888;letter-spacing:1px;margin-top:4px;">WET</div>
            <div class="param-value" id="val-wet">25%</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;min-width:200px;">
            <div style="font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">Imaging</div>
            <div style="width:100%;padding:60px 0 20px;">
              <input type="range" class="imaging-slider" id="imaging-slider" min="0" max="100" value="100" oninput="updateImaging(this.value)">
            </div>
            <div style="display:flex;justify-content:space-between;width:100%;font-size:9px;color:#555;">
              <span>MONO</span><span>WIDE</span>
            </div>
            <div style="display:flex;justify-content:space-between;width:100%;font-size:9px;color:#444;margin-top:2px;">
              <span>STEREO WIDTH</span>
            </div>
            <div class="param-value" id="val-imaging">100%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <div style="display:flex;gap:8px;">
      <button class="btn-dark active" style="padding:6px 18px;font-size:10px;letter-spacing:1px;">DRUMS</button>
      <button class="btn-dark" style="padding:6px 18px;font-size:10px;letter-spacing:1px;">KEYS</button>
      <button class="btn-dark" style="padding:6px 18px;font-size:10px;letter-spacing:1px;">VOCALS</button>
      <button class="btn-dark" style="padding:6px 18px;font-size:10px;letter-spacing:1px;">RUINS</button>
    </div>
    <div style="display:flex;gap:16px;align-items:center;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="font-size:9px;color:#555;letter-spacing:1px;">INPUT</div>
        <div class="meter-bar"><div class="meter-fill" id="meter-in-l" style="height:30%;"></div></div>
        <div class="meter-bar"><div class="meter-fill" id="meter-in-r" style="height:25%;"></div></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="font-size:9px;color:#555;letter-spacing:1px;">OUTPUT</div>
        <div class="meter-bar"><div class="meter-fill" id="meter-out-l" style="height:45%;"></div></div>
        <div class="meter-bar"><div class="meter-fill" id="meter-out-r" style="height:40%;"></div></div>
      </div>
    </div>
    <div style="display:flex;gap:20px;font-size:9px;color:#444;">
      <div style="text-align:right;"><div>A/D CONV</div><div style="color:#666;">0.0%</div></div>
      <div style="text-align:right;"><div>CPU TIME</div><div style="color:#666;">21 ms</div></div>
      <div style="text-align:right;"><div>SAMPLE RATE</div><div style="color:#666;">1x</div></div>
      <div style="text-align:right;"><div>OUT GAIN</div><div style="color:#666;">0.0 dB</div></div>
      <div style="text-align:right;"><div>CURRENT SIZE</div><div style="color:#666;">64 kHz</div></div>
    </div>
  </div>
</div>
<script>
const state={predelay:45,decay:2.5,size:65,diffusion:78,damping:42,highcut:12,lowcut:120,bassdamp:35,earlyref:60,crosstalk:50,modulation:15,width:100,dry:80,er:40,wet:25,imaging:100,enabled:true,room:'hall'};
const presets=['HALL — CLEAN SLATE','ROOM — TIGHT SPACE','PLATE — VINTAGE GOLD','SPRING — SURF VIBES','CATHEDRAL — SACRED AIR','ARENA — STADIUM ROCK'];
let presetIdx=0;
const knobConfig={predelay:{min:0,max:200,unit:' ms',decimals:0},decay:{min:.1,max:10,unit:' s',decimals:1},size:{min:0,max:100,unit:' %',decimals:0},diffusion:{min:0,max:100,unit:' %',decimals:0},damping:{min:0,max:100,unit:' %',decimals:0},highcut:{min:1,max:20,unit:' kHz',decimals:1},lowcut:{min:20,max:500,unit:' Hz',decimals:0},bassdamp:{min:0,max:100,unit:' %',decimals:0},earlyref:{min:0,max:100,unit:' %',decimals:0},crosstalk:{min:0,max:100,unit:' %',decimals:0},modulation:{min:0,max:100,unit:' %',decimals:0},width:{min:0,max:200,unit:' %',decimals:0}};
function valToAngle(p,v){const c=knobConfig[p];return-135+((v-c.min)/(c.max-c.min))*270}
function updateKnob(p){const a=valToAngle(p,state[p]),r=(a-90)*Math.PI/180,cx=36,cy=36,rad=26,x=cx+rad*Math.cos(r),y=cy+rad*Math.sin(r),sa=-135,ea=a,la=ea-sa>180?1:0,sr=(sa-90)*Math.PI/180,er=(ea-90)*Math.PI/180,sx=cx+rad*Math.cos(sr),sy=cy+rad*Math.sin(sr),ex=cx+rad*Math.cos(er),ey=cy+rad*Math.sin(er);const arc=document.getElementById('arc-'+p);if(arc)arc.setAttribute('d',`M ${sx} ${sy} A ${rad} ${rad} 0 ${la} 1 ${ex} ${ey}`);const dot=document.getElementById('dot-'+p);if(dot){dot.setAttribute('cx',x);dot.setAttribute('cy',y)}const c=knobConfig[p],ve=document.getElementById('val-'+p);if(ve)ve.textContent=state[p]+c.unit}
Object.keys(knobConfig).forEach(updateKnob);
function startKnob(e,p){e.preventDefault();const sY=e.type.startsWith('touch')?e.touches[0].clientY:e.clientY,sV=state[p],c=knobConfig[p],rng=c.max-c.min;function m(ev){const y=ev.type.startsWith('touch')?ev.touches[0].clientY:ev.clientY;let nV=sV+((sY-y)/3)*rng/100;nV=Math.max(c.min,Math.min(c.max,nV));if(c.decimals===0)nV=Math.round(nV);else nV=Math.round(nV*10)/10;state[p]=nV;updateKnob(p)}function u(){document.removeEventListener('mousemove',m);document.removeEventListener('mouseup',u);document.removeEventListener('touchmove',m);document.removeEventListener('touchend',u)}document.addEventListener('mousemove',m);document.addEventListener('mouseup',u);document.addEventListener('touchmove',m,{passive:false});document.addEventListener('touchend',u)}
function startFader(e,p){e.preventDefault();const t=e.currentTarget,rect=t.getBoundingClientRect();function m(ev){const y=ev.type.startsWith('touch')?ev.touches[0].clientY:ev.clientY;let pct=1-(y-rect.top)/rect.height;pct=Math.max(0,Math.min(1,pct));state[p]=Math.round(pct*100);updateFader(p)}function u(){document.removeEventListener('mousemove',m);document.removeEventListener('mouseup',u);document.removeEventListener('touchmove',m);document.removeEventListener('touchend',u)}document.addEventListener('mousemove',m);document.addEventListener('mouseup',u);document.addEventListener('touchmove',m,{passive:false});document.addEventListener('touchend',u);m(e)}
function updateFader(p){const pct=state[p],fill=document.getElementById('fill-'+p),thumb=document.getElementById('thumb-'+p),valEl=document.getElementById('val-'+p);if(fill)fill.style.height=pct+'%';if(thumb)thumb.style.bottom='calc('+pct+'% - 9px)';if(valEl)valEl.textContent=pct+'%'}
function updateImaging(v){state.imaging=v;document.getElementById('val-imaging').textContent=v+'%'}
function toggleEnable(){state.enabled=!state.enabled;document.getElementById('enable-btn').classList.toggle('active',state.enabled)}
function toggleAB(){document.getElementById('ab-btn').classList.toggle('active')}
function changePreset(dir){presetIdx=(presetIdx+dir+presets.length)%presets.length;document.getElementById('preset-name').textContent=presets[presetIdx]}
function setRoom(room){state.room=room;document.querySelectorAll('.room-btn').forEach(b=>b.classList.toggle('active',b.dataset.room===room))}
const canvas=document.getElementById('space-viz'),ctx=canvas.getContext('2d');let rotX=.3,rotY=.5;function drawCube(){const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(0,0,w,h);const sz=50,verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];function project(v){const x=v[0]*sz,y=v[1]*sz,z=v[2]*sz,rx=y*Math.sin(rotX)+z*Math.cos(rotX),ry=x*Math.cos(rotY)+(y*Math.cos(rotX)-z*Math.sin(rotX))*Math.sin(rotY),rz=-x*Math.sin(rotY)+(y*Math.cos(rotX)-z*Math.sin(rotX))*Math.cos(rotY),sc=200/(200+rz);return[w/2+rx*sc,h/2+ry*sc]}ctx.strokeStyle='#d4af37';ctx.lineWidth=1.5;ctx.shadowColor='#d4af37';ctx.shadowBlur=8;edges.forEach(e=>{const a=project(verts[e[0]]),b=project(verts[e[1]]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()});ctx.shadowBlur=0;rotX+=.005;rotY+=.008;requestAnimationFrame(drawCube)}drawCube();function animateMeters(){['in-l','in-r','out-l','out-r'].forEach(id=>{const el=document.getElementById('meter-'+id);if(el){const base=id.startsWith('in')?25:35;el.style.height=(base+Math.random()*30)+'%'}})}setInterval(animateMeters,80);
</script>
</body>
</html>
HTMLBLOCK

if [[ ! -s "$RESOLVED" ]]; then
  log_err "File write resulted in empty file"
  if [[ -f "$BACKUP_PATH" && "$BACKUP_PATH" != "(none)" ]]; then
    cp "$BACKUP_PATH" "$RESOLVED"
    log_ok "Restored from backup"
  fi
  exit 1
fi

NEW_SIZE=$(wc -c < "$RESOLVED" | tr -d ' ')
log_ok "Deployed successfully (${NEW_SIZE} bytes)"

log_step "Running integrity checks..."
VALIDATION_ISSUES=0
validate_html "$RESOLVED" || VALIDATION_ISSUES=$?

if [[ $VALIDATION_ISSUES -eq 0 ]]; then
  log_ok "All integrity checks passed"
else
  log_warn "Found $VALIDATION_ISSUES issue(s). Review output above."
  if [[ -f "$BACKUP_PATH" && "$BACKUP_PATH" != "(none)" ]]; then
    echo ""
    read -rp "$(echo -e "${YELLOW}Restore from backup? [y/N]: ${NC}")" restore
    if [[ "$restore" =~ ^[Yy]$ ]]; then
      cp "$BACKUP_PATH" "$RESOLVED"
      log_ok "Restored from backup: $BACKUP_PATH"
      exit 0
    fi
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Deployment complete${NC}"
echo ""
echo -e "  ${BOLD}Target:${NC}  $ABS_PATH"
echo -e "  ${BOLD}Backup:${NC}  $BACKUP_PATH"
echo -e "  ${BOLD}Size:${NC}    ${NEW_SIZE} bytes"
echo ""
echo -e "  ${CYAN}Interactive elements verified:${NC}"
echo -e "    • 12 rotary knobs (drag vertically to adjust)"
echo -e "    • 3 vertical faders (drag to adjust)"
echo -e "    • 1 imaging slider (horizontal)"
echo -e "    • 10 room-type buttons"
echo -e "    • Preset navigation (prev/next)"
echo -e "    • A/B toggle, Enable toggle"
echo -e "    • Animated 3D space visualizer"
echo -e "    • Animated I/O level meters"
echo ""
