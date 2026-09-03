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
