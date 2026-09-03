#!/usr/bin/env bash
#
# R3V4 UI Bugfix & Polish Patch — v2.1.0
# Fixes: layout, interaction bugs, accessibility, performance
# Preserves: all colors, themes, visual design
#
set -euo pipefail

PROJECT_DIR="${1:-$HOME/projects/reverb-engine}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

cd "$PROJECT_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 1: index.css — Font loading + CSS reset
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching index.css..."
cat > src/index.css << 'CSS_EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --r3-bg-base: #09090c;
  --r3-bg-surface: #121216;
  --r3-bg-elevated: #1a1a1f;
  --r3-border-subtle: rgba(255, 255, 255, 0.06);
  --r3-accent: #c9a84c;
  --r3-accent-dim: rgba(201, 168, 76, 0.12);
  --r3-text-primary: #e8e8ea;
  --r3-text-secondary: #8a8a8e;
  --r3-text-tertiary: #5a5a5e;
  --r3-danger: #c94a4a;
  --r3-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --r3-font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

*, *::before, *::after { box-sizing: border-box; }

html, body, #root {
  margin: 0; padding: 0; width: 100%; height: 100%;
  background: var(--r3-bg-base);
  font-family: var(--r3-font-sans);
  color: var(--r3-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

button, select, input, canvas {
  font-family: inherit;
  color: inherit;
}

button { border: none; background: none; cursor: pointer; }
select { appearance: none; background-image: none; }

@keyframes r3-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
CSS_EOF
log_ok "index.css patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 2: R3V4Plugin.tsx — Full-screen layout + spacing consistency
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching R3V4Plugin.tsx..."
cat > src/ui/R3V4Plugin.tsx << 'PLUGIN_EOF'
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useR3V4Store } from '../lib/store';
import { R3V4_FONTS, PARAMETER_RANGES, SPACE_MODES, SpaceMode } from '../types/reverb';
import { FACTORY_PRESETS } from '../lib/presets';
import { R3V4AudioEngine, InputSource } from '../lib/audioEngine';
import { Knob } from './components/Knob';
import { Fader } from './components/Fader';
import { Meter } from './components/Meter';
import { SpaceCube } from './components/SpaceCube';
import { StereoWidthSlider } from './components/StereoWidthSlider';

const ACCENT = '#c9a84c';
const ACCENT_DIM = 'rgba(201,168,76,0.12)';
const BG_SURFACE = '#121216';
const BG_ELEVATED = '#1a1a1f';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT_PRIMARY = '#e8e8ea';
const TEXT_SECONDARY = '#8a8a8e';
const TEXT_TERTIARY = '#5a5a5e';

const AUDIO_CONSENT_KEY = 'r3v4-audio-consent';

const panelStyle = (pad = 10): React.CSSProperties => ({
  background: BG_ELEVATED,
  borderRadius: 6,
  border: `1px solid ${BORDER}`,
  padding: pad,
});

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: TEXT_TERTIARY,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 500,
};

const btnBase: React.CSSProperties = {
  background: BG_SURFACE,
  border: `1px solid ${BORDER}`,
  color: TEXT_SECONDARY,
  padding: '5px 10px',
  borderRadius: 4,
  fontSize: 10,
  cursor: 'pointer',
  letterSpacing: '0.05em',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const btnHover = (active: boolean): React.CSSProperties => ({
  ...btnBase,
  borderColor: active ? 'rgba(255,255,255,0.15)' : BORDER,
  color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
});

const KNOB_GROUPS = [
  {
    title: 'Time',
    params: [
      ['preDelay', 'Pre-Delay'],
      ['decay', 'Decay'],
      ['size', 'Size'],
      ['diffusion', 'Diffusion'],
    ] as const,
  },
  {
    title: 'Tone',
    params: [
      ['damping', 'Damping'],
      ['highCut', 'High Cut'],
      ['lowCut', 'Low Cut'],
      ['bassDamping', 'Bass Damp'],
    ] as const,
  },
  {
    title: 'Character',
    params: [
      ['earlyReflections', 'Early Ref'],
      ['crosstalk', 'Crosstalk'],
      ['modulation', 'Modulation'],
      ['stereoWidth', 'Width'],
    ] as const,
  },
];

const TOGGLE_PARAMS = [
  { param: 'freeze' as const, icon: '❄', label: 'Freeze' },
  { param: 'ducking' as const, icon: '▽', label: 'Ducking' },
  { param: 'tempoSync' as const, icon: '⌛', label: 'Tempo' },
  { param: 'oversampling' as const, icon: '⊕', label: '2× OS' },
];

const CATEGORIES = [
  { key: 'Drums', label: 'Drums' },
  { key: 'Keys', label: 'Keys' },
  { key: 'Vocals', label: 'Vocals' },
  { key: 'Master Bus', label: 'Buss' },
  { key: 'Master', label: 'Master' },
];

export function R3V4Plugin() {
  const store = useR3V4Store();
  const engineRef = useRef<R3V4AudioEngine | null>(null);
  const isUnlockingRef = useRef(false);
  const userPausedRef = useRef(false);

  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [needsFirstGesture, setNeedsFirstGesture] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [hasStoredConsent] = useState(() => localStorage.getItem(AUDIO_CONSENT_KEY) === '1');
  const [audioStatus, setAudioStatus] = useState('Audio off');
  const [inputSource, setInputSource] = useState<InputSource>(
    () => (localStorage.getItem('r3v4-input-source') as InputSource | null) ?? 'test-tone'
  );
  const [presetDisplay, setPresetDisplay] = useState('');

  useEffect(() => {
    const engine = new R3V4AudioEngine();
    engineRef.current = engine;

    engine.onMetrics((m) => {
      setInputLevel(m.peakInputL || 0);
      setOutputLevel(m.peakOutputL || 0);
      setCpuUsage(m.cpuLoad || 0);
    });

    engine.onStateChange((state) => {
      const running = state === 'running';
      setAudioEnabled(running);
      if (!running) {
        if (userPausedRef.current) {
          setAudioStatus('Paused');
          store.setProcessing(false);
          return;
        }
        setNeedsFirstGesture(true);
        setAudioStatus('Suspended — click to enable');
        store.setProcessing(false);
      } else {
        userPausedRef.current = false;
        setNeedsFirstGesture(false);
        setAudioStatus(engine.getInputSource() === 'mic' ? 'Microphone' : 'Test Tone');
        store.setProcessing(true);
      }
    });

    return () => engine.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setParameters(store.parameters);
  }, [store.parameters]);

  useEffect(() => {
    const name = store.presetName.split('—').pop()?.trim() || store.presetName;
    setPresetDisplay(`${store.spaceMode.toUpperCase()} — ${name.toUpperCase()}`);
  }, [store.presetName, store.spaceMode]);

  const applyAudioRunningState = useCallback((running: boolean) => {
    setAudioEnabled(running);
    if (running) setNeedsFirstGesture(false);
    setAudioStatus(running
      ? (inputSource === 'mic' ? 'Microphone' : 'Test Tone')
      : 'Suspended — click to enable');
    store.setProcessing(running);
  }, [inputSource, store]);

  const enableAudio = useCallback(async () => {
    const e = engineRef.current;
    if (!e) return;
    const ok = await e.initialize(inputSource);
    if (ok) {
      const running = e.isRunning;
      if (running) localStorage.setItem(AUDIO_CONSENT_KEY, '1');
      setInputSource(e.getInputSource());
      localStorage.setItem('r3v4-input-source', e.getInputSource());
      applyAudioRunningState(running);
    } else {
      setAudioBlocked(true);
      setNeedsFirstGesture(false);
      setAudioStatus('Audio unavailable');
      store.setProcessing(false);
    }
  }, [inputSource, applyAudioRunningState, store]);

  const unlockAudio = useCallback(async () => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    try {
      const e = engineRef.current;
      if (!e) return;
      if (!e.initialized) await enableAudio();
      else {
        await e.resume();
        applyAudioRunningState(e.isRunning);
      }
    } finally {
      isUnlockingRef.current = false;
    }
  }, [enableAudio, applyAudioRunningState]);

  const toggleAudio = useCallback(async () => {
    const e = engineRef.current;
    if (!e) return;
    if (!e.initialized) { await unlockAudio(); return; }
    userPausedRef.current = e.isRunning;
    await e.toggle();
    const running = e.isRunning;
    setAudioEnabled(running);
    if (running) setNeedsFirstGesture(false);
    setAudioStatus(running ? (e.getInputSource() === 'mic' ? 'Microphone' : 'Test Tone') : 'Paused');
    store.setProcessing(running);
  }, [unlockAudio, store]);

  const changeInputSource = useCallback(async (source: InputSource) => {
    setInputSource(source);
    localStorage.setItem('r3v4-input-source', source);
    const e = engineRef.current;
    if (!e) return;
    if (e.initialized) {
      await e.setInputSource(source);
      const actual = e.getInputSource();
      setInputSource(actual);
      localStorage.setItem('r3v4-input-source', actual);
      setAudioStatus(actual === 'mic' ? 'Microphone' : (source === 'mic' ? 'Mic denied — test tone' : 'Test Tone'));
    }
  }, []);

  const showAudioBanner = needsFirstGesture && !audioBlocked;

  useEffect(() => {
    if (!showAudioBanner) return;
    let fired = false;
    const handler = () => { if (!fired) { fired = true; unlockAudio(); } };
    if (hasStoredConsent) {
      document.addEventListener('mousedown', handler, { once: true });
      document.addEventListener('keydown', handler, { once: true });
      return () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('keydown', handler);
      };
    } else {
      document.addEventListener('click', handler, { once: true });
      return () => document.removeEventListener('click', handler);
    }
  }, [showAudioBanner, unlockAudio, hasStoredConsent]);

  const handleParamChange = useCallback((param: string, value: number | boolean) => {
    store.setParameter(param as any, value);
  }, [store]);

  const allPresets = useMemo(() => [...FACTORY_PRESETS, ...store.userPresets], [store.userPresets]);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    store.loadPresetByName(e.target.value);
  }, [store]);

  return (
    <div style={{
      fontFamily: R3V4_FONTS.body || '-apple-system, BlinkMacSystemFont, sans-serif',
      color: TEXT_PRIMARY,
      width: '100vw',
      height: '100vh',
      background: '#09090c',
      borderRadius: 0,
      border: 'none',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Unlock banner */}
      {showAudioBanner && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03), rgba(201,168,76,0.08))',
          borderBottom: `1px solid rgba(201,168,76,0.2)`,
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          animation: 'r3-pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: ACCENT }}>⚠</span>
          <span style={{ fontSize: 10, color: ACCENT, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Click anywhere to enable audio
          </span>
          <span style={{ fontSize: 9, color: 'rgba(201,168,76,0.5)' }}>
            Browser autoplay policy requires a user gesture
          </span>
        </div>
      )}

      {/* Audio blocked banner */}
      {audioBlocked && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(201,60,60,0.1), rgba(201,60,60,0.05), rgba(201,60,60,0.1))',
          borderBottom: '1px solid rgba(201,60,60,0.3)',
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14 }}>🔇</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#c94a4a', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Audio blocked by browser
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,120,120,0.6)' }}>
              Allow audio in your browser settings, then reload the page
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 8, background: 'rgba(201,60,60,0.2)',
              border: '1px solid rgba(201,60,60,0.4)', borderRadius: 4,
              color: '#ff9999', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.1em', padding: '5px 12px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            Reload
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: BG_SURFACE, borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0, gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4b85a, #a08030)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(201,168,76,0.3)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#0a0a0d', letterSpacing: -0.5 }}>R3</span>
          </div>
          <div>
            <div style={{
              fontFamily: R3V4_FONTS.display || '-apple-system, sans-serif',
              fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: 3, lineHeight: 1,
            }}>R3V4</div>
            <div style={{ fontSize: 8, color: TEXT_TERTIARY, letterSpacing: '0.15em', fontWeight: 500, marginTop: 2 }}>
              REVERB ENGINE v1.0
            </div>
          </div>
        </div>

        {/* Preset selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', maxWidth: 420, minWidth: 0 }}>
          <button onClick={store.previousPreset} style={btnBase}>◀</button>
          <div style={{
            flex: 1, textAlign: 'center', padding: '6px 12px', minWidth: 0,
            background: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: 4,
            fontSize: 11, color: ACCENT, fontWeight: 600, letterSpacing: '0.05em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{presetDisplay}</div>
          <button onClick={store.nextPreset} style={btnBase}>▶</button>
          <select value={store.presetName} onChange={handlePresetChange} style={{ ...btnBase, maxWidth: 180, minWidth: 0 }}>
            {allPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={store.undo} disabled={store.historyIndex <= 0} style={btnHover(store.historyIndex > 0)} title="Undo">↶</button>
          <button onClick={store.redo} disabled={store.historyIndex >= store.history.length - 1} style={btnHover(store.historyIndex < store.history.length - 1)} title="Redo">↷</button>
          <button onClick={() => store.activeAB === 'A' ? store.captureStateA() : store.captureStateB()} style={{ ...btnBase, borderColor: ACCENT, color: ACCENT }} title="A/B Compare">A/B</button>
          <button onClick={() => store.saveUserPreset(`Custom ${Date.now()}`, 'User')} style={btnBase} title="Save Preset">💾</button>
          <button onClick={store.randomize} style={btnBase} title="Randomize">⚄</button>

          <div style={{ width: 1, height: 24, background: BORDER, margin: '0 4px' }} />

          <select value={inputSource} onChange={(e) => changeInputSource(e.target.value as InputSource)} style={btnBase}>
            <option value="test-tone">Test Tone</option>
            <option value="mic">Microphone</option>
          </select>

          <button onClick={toggleAudio} style={{
            ...btnBase, minWidth: 80,
            background: audioEnabled ? ACCENT_DIM : BG_SURFACE,
            borderColor: audioEnabled ? 'rgba(201,168,76,0.3)' : BORDER,
            color: audioEnabled ? ACCENT : TEXT_SECONDARY,
          }}>{audioEnabled ? '● ON' : 'ENABLE'}</button>

          <button onClick={toggleAudio} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: store.isProcessing ? ACCENT : BG_SURFACE,
            border: `2px solid ${store.isProcessing ? 'rgba(201,168,76,0.4)' : BORDER}`,
            color: store.isProcessing ? '#0a0a0d' : TEXT_TERTIARY,
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }} title="Power">⏻</button>
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{
          padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
          borderRight: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.01)',
          overflow: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ ...labelStyle, color: ACCENT }}>Space Visualizer</span>
            <span style={{
              fontSize: 8, color: TEXT_TERTIARY, letterSpacing: '0.1em',
              padding: '2px 6px', border: `1px solid ${BORDER}`, borderRadius: 3, textTransform: 'uppercase',
            }}>{store.spaceMode}</span>
          </div>

          <div style={{ ...panelStyle(0), overflow: 'hidden', padding: 0, flexShrink: 0 }}>
            <SpaceCube size={store.parameters.size} decay={store.parameters.decay} height={150} />
          </div>

          {/* Space modes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, flexShrink: 0 }}>
            {SPACE_MODES.map((mode) => {
              const active = store.spaceMode === mode;
              return (
                <button key={mode} onClick={() => store.setSpaceMode(mode as SpaceMode)} style={{
                  background: active ? ACCENT_DIM : 'transparent',
                  border: `1px solid ${active ? 'rgba(201,168,76,0.3)' : BORDER}`,
                  color: active ? ACCENT : TEXT_TERTIARY,
                  padding: '5px 0', borderRadius: 4, fontSize: 8, cursor: 'pointer',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontWeight: active ? 600 : 500, transition: 'all 0.15s',
                }}>{mode}</button>
              );
            })}
          </div>

          {/* ASI Smart Mode */}
          <button onClick={() => {}} style={{
            background: 'linear-gradient(90deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
            border: `1px solid rgba(201,168,76,0.2)`, color: ACCENT,
            padding: '8px 0', borderRadius: 6, fontSize: 9, cursor: 'pointer',
            letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11 }}>✦</span>
            ASI Smart Mode
          </button>

          {/* Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, flexShrink: 0 }}>
            {TOGGLE_PARAMS.map(({ param, icon, label }) => {
              const active = store.parameters[param] as boolean;
              return (
                <button key={param} onClick={() => handleParamChange(param, !active)} style={{
                  background: active ? ACCENT_DIM : 'transparent',
                  border: `1px solid ${active ? 'rgba(201,168,76,0.25)' : BORDER}`,
                  color: active ? ACCENT : TEXT_TERTIARY,
                  padding: '6px 0', borderRadius: 4, fontSize: 9, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontWeight: active ? 600 : 500, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 10 }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Categories */}
          <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => store.loadFirstPresetByCategory(cat.key)} style={{
                background: 'transparent', border: `1px solid ${BORDER}`,
                color: TEXT_TERTIARY, padding: '4px 8px', borderRadius: 4,
                fontSize: 8, cursor: 'pointer', letterSpacing: '0.05em',
                textTransform: 'uppercase', transition: 'all 0.15s',
              }}>{cat.label}</button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minWidth: 0 }}>

          {/* Knob groups */}
          {KNOB_GROUPS.map((group) => (
            <div key={group.title} style={panelStyle()}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>{group.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {group.params.map(([param, label]) => (
                  <Knob
                    key={param}
                    value={store.parameters[param as keyof typeof store.parameters] as number}
                    range={PARAMETER_RANGES[param]}
                    label={label}
                    onChange={(v) => handleParamChange(param, v)}
                    size={44}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Mix section */}
          <div style={panelStyle()}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Mix</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.6fr', gap: 16, alignItems: 'flex-end' }}>
              {[
                { param: 'dry', label: 'Dry', sub: 'Direct' },
                { param: 'er', label: 'ER', sub: 'Early' },
                { param: 'wet', label: 'Wet', sub: 'Reverb' },
              ].map(({ param, label, sub }) => (
                <div key={param} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <span style={labelStyle}>{sub}</span>
                  <Fader
                    value={store.parameters[param as keyof typeof store.parameters] as number}
                    label={label}
                    onChange={(v) => handleParamChange(param, v)}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end' }}>
                <span style={labelStyle}>Imaging</span>
                <StereoWidthSlider
                  value={store.parameters.stereoWidth}
                  min={0} max={200}
                  onChange={(v) => handleParamChange('stereoWidth', v)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', background: BG_SURFACE, borderTop: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Meter level={inputLevel} label="Input" />
          <Meter level={outputLevel} label="Output" />
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Stat label="Audio" value={audioStatus} color={audioEnabled ? ACCENT : TEXT_TERTIARY} />
          <Stat label="CPU" value={`${cpuUsage.toFixed(1)}%`} color={ACCENT} />
          <Stat label="Latency" value="2.1 ms" />
          <Stat label="OS Rate" value={store.parameters.oversampling ? '2×' : '1×'} />
          <Stat label="Sample Rate" value={`${store.sampleRate / 1000} kHz`} />
          <Stat label="Neural" value={store.isProcessing ? 'ACTIVE' : 'IDLE'} color={store.isProcessing ? ACCENT : TEXT_TERTIARY} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: color || TEXT_SECONDARY, fontWeight: 600, marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}
PLUGIN_EOF
log_ok "R3V4Plugin.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 3: Knob.tsx — Canvas resize optimization + pointer capture release
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching Knob.tsx..."
cat > src/ui/components/Knob.tsx << 'KNOB_EOF'
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ParameterRange } from '../../types/reverb';

const ACCENT = '#c9a84c';
const TICK_COUNT = 54;
const START_ANGLE = Math.PI * 0.75;
const SWEEP_ANGLE = Math.PI * 1.5;

interface KnobProps {
  value: number;
  range: ParameterRange;
  label: string;
  onChange: (value: number) => void;
  size?: number;
}

export function Knob({ value, range, label, onChange, size = 48 }: KnobProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);
  const dprRef = useRef(1);

  // Resize canvas only when size or dpr changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== dprRef.current || canvas.width !== size * dpr) {
      dprRef.current = dpr;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
  }, [size]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 4;
    const pct = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const endAngle = START_ANGLE + pct * SWEEP_ANGLE;

    for (let i = 0; i <= TICK_COUNT; i++) {
      const angle = START_ANGLE + (i / TICK_COUNT) * SWEEP_ANGLE;
      const isMajor = i % 3 === 0;
      const outer = R - 1;
      const inner = R - (isMajor ? 5 : 3);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const lit = i / TICK_COUNT <= pct;

      ctx.beginPath();
      ctx.moveTo(cx + cos * outer, cy + sin * outer);
      ctx.lineTo(cx + cos * inner, cy + sin * inner);
      ctx.lineWidth = isMajor ? 1.2 : 0.6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = lit
        ? isMajor ? 'rgba(201,168,76,0.8)' : 'rgba(201,168,76,0.35)'
        : isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
      ctx.stroke();
    }

    const arcR = R - 7;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, START_ANGLE, START_ANGLE + SWEEP_ANGLE);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, START_ANGLE, endAngle);
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = hovered ? 10 : 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const bodyR = R * 0.72;
    const bodyGrad = ctx.createRadialGradient(
      cx - bodyR * 0.3, cy - bodyR * 0.3, bodyR * 0.1,
      cx, cy, bodyR
    );
    bodyGrad.addColorStop(0, '#2a2a2e');
    bodyGrad.addColorStop(0.5, '#1a1a1e');
    bodyGrad.addColorStop(1, '#0e0e12');
    ctx.beginPath();
    ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const ix = cx + Math.cos(endAngle) * bodyR * 0.75;
    const iy = cy + Math.sin(endAngle) * bodyR * 0.75;
    const ix2 = cx + Math.cos(endAngle) * bodyR * 0.35;
    const iy2 = cy + Math.sin(endAngle) * bodyR * 0.35;

    ctx.beginPath();
    ctx.moveTo(ix2, iy2);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = '#e8e8ea';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    const capR = bodyR * 0.18;
    ctx.beginPath();
    ctx.arc(cx, cy, capR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [value, range, size, hovered]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = (startYRef.current - e.clientY) * (range.max - range.min) / 180;
      let v = Math.max(range.min, Math.min(range.max, startValRef.current + delta));
      v = Math.round(v / range.step) * range.step;
      onChange(v);
    };
    const handleUp = (e: PointerEvent) => {
      setDragging(false);
      const target = e.target as HTMLCanvasElement;
      if (target.releasePointerCapture) {
        try { target.releasePointerCapture(e.pointerId); } catch {}
      }
    };
    if (dragging) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, range, onChange]);

  const display = range.displayFormat(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        data-testid="knob-canvas"
        aria-label={`${label} knob`}
        tabIndex={0}
        style={{
          width: size, height: size,
          cursor: dragging ? 'grabbing' : 'grab',
          display: 'block', touchAction: 'none',
          outline: 'none',
        }}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <span style={{
        fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase',
        letterSpacing: '0.12em', fontWeight: 500,
      }}>{label}</span>
      <span style={{
        fontSize: 10, color: ACCENT, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3,
      }}>
        {display}
        <span style={{ fontSize: 8, color: 'rgba(201,168,76,0.5)', marginLeft: 2 }}>{range.unit}</span>
      </span>
    </div>
  );
}
KNOB_EOF
log_ok "Knob.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 4: Fader.tsx — ARIA + fill height fix + accessibility
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching Fader.tsx..."
cat > src/ui/components/Fader.tsx << 'FADER_EOF'
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FaderProps {
  value: number;
  label: string;
  onChange: (value: number) => void;
}

const ACCENT = '#c9a84c';
const TRACK_HEIGHT = 90;
const TRACK_WIDTH = 28;

export function Fader({ value, label, onChange }: FaderProps) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawPct = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(100, rawPct * 100)));
  }, [onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    updateFromPointer(e.clientY);
    e.preventDefault();
  }, [updateFromPointer]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientY);
    const handleUp = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, updateFromPointer]);

  const fillHeight = Math.max(0, (value / 100) * (TRACK_HEIGHT - 4));
  const handlePct = 100 - value;

  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, userSelect: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        style={{
          width: TRACK_WIDTH, height: TRACK_HEIGHT, position: 'relative',
          cursor: 'ns-resize', touchAction: 'none',
          background: '#0a0a0d', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
        }}
        onPointerDown={handlePointerDown}
      >
        <div style={{
          position: 'absolute', left: '50%', top: 6, bottom: 6,
          width: 1, transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: 2, left: 2, right: 2,
          height: fillHeight,
          background: `linear-gradient(0deg, ${ACCENT}, rgba(201,168,76,0.2))`,
          borderRadius: '0 0 4px 4px',
          transition: dragging ? 'none' : 'height 0.08s ease',
        }} />
        <div style={{
          position: 'absolute', left: 1, right: 1, height: 18,
          top: `${handlePct}%`, transform: 'translateY(-50%)',
          borderRadius: 4, pointerEvents: 'none',
          background: hovered ? '#e8e8ea' : '#c0c0c0',
          border: '1px solid rgba(0,0,0,0.3)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          transition: 'background 0.15s',
        }}>
          <div style={{
            position: 'absolute', left: 4, right: 4, top: '50%',
            height: 2, transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.25)', borderRadius: 1,
          }} />
        </div>
      </div>
      <span style={{
        fontSize: 9, color: ACCENT, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{ fontSize: 10, color: '#8a8a8e', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}
FADER_EOF
log_ok "Fader.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 5: Meter.tsx — Canvas resize optimization + clip indicator
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching Meter.tsx..."
cat > src/ui/components/Meter.tsx << 'METER_EOF'
import { useRef, useEffect } from 'react';

interface MeterProps {
  level: number;
  label: string;
}

const SEGMENTS = 24;
const GAP = 1;
const DB_MIN = -60;
const DB_MAX = 6;
const HOLD_TIME_MS = 1500;
const CANVAS_W = 120;
const CANVAS_H = 30;

function dBFromLinear(linear: number): number {
  if (linear <= 0.000001) return -Infinity;
  return 20 * Math.log10(linear);
}

function segmentColor(ratio: number): string {
  if (ratio < 0.65) return '#4ac98a';
  if (ratio < 0.80) return '#c9a84c';
  if (ratio < 0.90) return '#d4a03a';
  return '#c94a4a';
}

export function Meter({ level, label }: MeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakRef = useRef(-Infinity);
  const peakTimeRef = useRef(0);
  const dprRef = useRef(1);
  const clipRef = useRef(false);
  const clipTimeRef = useRef(0);

  // Resize canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = CANVAS_W;
    const barH = CANVAS_H - 16;
    const segW = (w - GAP * (SEGMENTS - 1)) / SEGMENTS;

    const db = dBFromLinear(level);
    const pct = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)));
    const activeCount = Math.floor(SEGMENTS * pct);

    const now = performance.now();
    if (db > peakRef.current) {
      peakRef.current = db;
      peakTimeRef.current = now;
    } else if (now - peakTimeRef.current > HOLD_TIME_MS) {
      peakRef.current = db;
    }

    // Clip detection
    if (db > 0) {
      clipRef.current = true;
      clipTimeRef.current = now;
    } else if (now - clipTimeRef.current > 1000) {
      clipRef.current = false;
    }

    const peakPct = Math.max(0, Math.min(1, (peakRef.current - DB_MIN) / (DB_MAX - DB_MIN)));
    const peakIndex = Math.floor(SEGMENTS * peakPct);

    ctx.clearRect(0, 0, w, CANVAS_H);

    for (let i = 0; i < SEGMENTS; i++) {
      const x = i * (segW + GAP);
      ctx.fillStyle = '#1a1a1f';
      ctx.fillRect(x, 0, segW, barH);
    }

    for (let i = 0; i < SEGMENTS; i++) {
      const x = i * (segW + GAP);
      const ratio = i / SEGMENTS;
      if (i < activeCount) {
        ctx.fillStyle = segmentColor(ratio);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 3;
        ctx.fillRect(x, 0, segW, barH);
        ctx.shadowBlur = 0;
      }
    }

    if (peakIndex >= 0 && peakIndex < SEGMENTS) {
      const x = peakIndex * (segW + GAP);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 0, segW, barH);
    }

    // dB text with clip indicator
    ctx.fillStyle = clipRef.current ? '#c94a4a' : '#8a8a8e';
    ctx.font = '10px "JetBrains Mono", "SF Mono", Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const dbText = db > DB_MIN ? `${db.toFixed(1)} dB` : '-∞ dB';
    const displayText = clipRef.current ? 'CLIP ' + dbText : dbText;
    ctx.fillText(displayText, w, barH + 3);
  }, [level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
      <span style={{
        fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase',
        letterSpacing: '0.1em', fontWeight: 500,
      }}>{label}</span>
      <canvas
        ref={canvasRef}
        style={{
          width: CANVAS_W, height: CANVAS_H, borderRadius: 3,
          background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
    </div>
  );
}
METER_EOF
log_ok "Meter.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 6: SpaceCube.tsx — ResizeObserver + particle regeneration on size change
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching SpaceCube.tsx..."
cat > src/ui/components/SpaceCube.tsx << 'CUBE_EOF'
import { useRef, useEffect, useState } from 'react';

interface SpaceCubeProps {
  size: number;
  decay: number;
  particleCount?: number;
  height?: number;
}

export function SpaceCube({ size, decay, particleCount = 60, height = 150 }: SpaceCubeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(220);
  const particlesRef = useRef<Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    life: number;
  }>>([]);
  const sizeRef = useRef(size);
  const decayRef = useRef(decay);
  const visibleRef = useRef(true);

  sizeRef.current = size;
  decayRef.current = decay;

  // ResizeObserver to fill container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setCanvasWidth(Math.floor(w));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Regenerate particles when size prop changes significantly
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * sizeRef.current,
      y: (Math.random() - 0.5) * sizeRef.current,
      z: (Math.random() - 0.5) * sizeRef.current,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      life: Math.random() * Math.PI * 2,
    }));
  }, [particleCount, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);

    let animId: number;
    let rotation = 0;
    let rotY = 0;
    const cx = canvasWidth / 2;
    const cy = height / 2;

    const project = (x: number, y: number, z: number) => {
      const fov = 350;
      const scale = fov / (fov + z);
      return { x: cx + x * scale, y: cy + y * scale, scale };
    };

    const rotateY = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    const rotateX = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const transform = (x: number, y: number, z: number) => {
      const r1 = rotateY(x, y, z, rotation);
      return rotateX(r1.x, r1.y, r1.z, rotY);
    };

    const draw = () => {
      if (!visibleRef.current) {
        animId = requestAnimationFrame(draw);
        return;
      }

      const sz = sizeRef.current;
      const dc = decayRef.current;
      rotation += 0.003 + (dc / 30) * 0.002;
      rotY += 0.001;

      const cubeSize = sz * (0.5 + (sz / 100) * 0.4);
      const hs = cubeSize / 2;

      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, canvasWidth, height);

      const verts = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs],
      ].map(([x, y, z]) => transform(x, y, z));
      const proj = verts.map(v => project(v.x, v.y, v.z));

      const edges: [number, number][] = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],
      ];

      const faces: [number, number, number, number][] = [
        [0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5],
      ];
      faces.forEach(([a, b, c, d]) => {
        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.lineTo(proj[c].x, proj[c].y);
        ctx.lineTo(proj[d].x, proj[d].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(201,168,76,0.02)';
        ctx.fill();
      });

      ctx.lineCap = 'round';
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.strokeStyle = 'rgba(201,168,76,0.08)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.strokeStyle = 'rgba(201,168,76,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      proj.forEach(({ x, y, scale }) => {
        const r = 2 * scale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,168,76,0.6)';
        ctx.fill();
      });

      const inner = hs * 0.35;
      const oct = [
        [0, -inner, 0], [0, inner, 0],
        [-inner, 0, 0], [inner, 0, 0],
        [0, 0, -inner], [0, 0, inner],
      ].map(([x, y, z]) => {
        const t = transform(x, y, z);
        return project(t.x, t.y, t.z);
      });
      const octEdges: [number, number][] = [
        [0,2],[0,3],[0,4],[0,5],
        [1,2],[1,3],[1,4],[1,5],
        [2,4],[4,3],[3,5],[5,2],
      ];
      ctx.strokeStyle = 'rgba(201,168,76,0.1)';
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 3]);
      octEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(oct[a].x, oct[a].y);
        ctx.lineTo(oct[b].x, oct[b].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const speed = 0.6 + (dc / 30) * 0.8;
      const active = Math.floor(particlesRef.current.length * (0.2 + (dc / 30) * 0.6));
      particlesRef.current.forEach((p, i) => {
        if (i >= active) return;
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        p.z += p.vz * speed;
        p.life += 0.01;
        if (Math.abs(p.x) > hs) p.vx *= -1;
        if (Math.abs(p.y) > hs) p.vy *= -1;
        if (Math.abs(p.z) > hs) p.vz *= -1;

        const alpha = 0.2 + 0.4 * Math.abs(Math.sin(p.life));
        const t = transform(p.x, p.y, p.z);
        const pr = project(t.x, t.y, t.z);
        const r = Math.max(0.5, 1.2 * pr.scale);

        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); observer.disconnect(); };
  }, [height, canvasWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, borderRadius: 6, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: canvasWidth, height, display: 'block' }}
      />
    </div>
  );
}
CUBE_EOF
log_ok "SpaceCube.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 7: StereoWidthSlider.tsx — Handle bounds + ARIA
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Patching StereoWidthSlider.tsx..."
cat > src/ui/components/StereoWidthSlider.tsx << 'SLIDER_EOF'
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface StereoWidthSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const ACCENT = '#c9a84c';

export function StereoWidthSlider({ value, min, max, onChange }: StereoWidthSliderProps) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = (value - min) / (max - min);

  const updateFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = (clientX - rect.left) / rect.width;
    const newVal = Math.max(min, Math.min(max, min + p * (max - min)));
    onChange(Math.round(newVal));
  }, [min, max, onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    updateFromPointer(e.clientX);
    e.preventDefault();
  }, [updateFromPointer]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, updateFromPointer]);

  return (
    <div
      role="slider"
      aria-label="Stereo Width"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, userSelect: 'none' }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <span>Mono</span>
        <span>Wide</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        style={{
          height: 20, width: '100%', borderRadius: 10,
          cursor: 'ew-resize', touchAction: 'none',
          background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', left: 2, top: 2, bottom: 2,
          width: `calc(${pct * 100}% - 4px)`, borderRadius: 8,
          background: `linear-gradient(90deg, rgba(201,168,76,0.2), ${ACCENT})`,
          transition: dragging ? 'none' : 'width 0.15s ease',
        }} />
        <div style={{
          position: 'absolute', left: `${pct * 100}%`, top: 2,
          width: 20, height: 14, borderRadius: 7,
          background: '#e8e8ea', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          transform: 'translateX(-50%)',
          transition: dragging ? 'none' : 'left 0.15s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {value}%
        </span>
        <span style={{ fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Stereo Width
        </span>
      </div>
    </div>
  );
}
SLIDER_EOF
log_ok "StereoWidthSlider.tsx patched"

# ═══════════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════════
log_info "Building..."
npm run build

echo ""
echo -e "${GREEN}✓ Patch applied successfully!${NC}"
echo "Changes: full-screen layout, canvas resize optimization, ARIA labels,"
echo "         clip indicator, pointer capture release, ResizeObserver on SpaceCube"
