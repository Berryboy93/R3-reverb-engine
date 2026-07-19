import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useR3V4Store } from '../lib/store';
import { R3V4_COLORS, PARAMETER_RANGES, SPACE_MODES, SpaceMode } from '../types/reverb';
import { FACTORY_PRESETS } from '../lib/presets';
import { R3V4AudioEngine } from '../lib/audioEngine';
import { Knob } from './components/Knob';
import { Fader } from './components/Fader';
import { Meter } from './components/Meter';
import { SpaceCube } from './components/SpaceCube';
import { StereoWidthSlider } from './components/StereoWidthSlider';

const NEON = R3V4_COLORS.neonNativeGreen;

const TIPS = [
  { title: 'Pre-Delay', body: 'Preserves attack transients while adding space. Increase for vocals.', icon: '⏱' },
  { title: 'EQ the Reverb', body: 'High-pass and low-pass the reverb return to maintain mix clarity.', icon: '≃' },
  { title: 'Parallel Reverb', body: 'Blend ambience using auxiliary buses for maximum control.', icon: '∿' },
  { title: 'Short Decays', body: 'Improve clarity for drums and rhythm instruments.', icon: '🥁' },
  { title: 'Long Decays', body: 'Create cinematic textures and atmospheric pads.', icon: '🎬' },
];

const FEATURES = [
  { icon: 'AI', label: 'Smart AI' },
  { icon: '3D', label: 'Spatial' },
  { icon: 'FDN', label: '8×8 Matrix' },
  { icon: '2x', label: 'Oversample' },
  { icon: 'RT', label: 'Real-Time' },
  { icon: 'LOW', label: 'Low CPU' },
];

const CATEGORIES = [
  { key: 'Drums', label: 'Drums', icon: '🥁' },
  { key: 'Keys', label: 'Keys', icon: '🎹' },
  { key: 'Vocals', label: 'Vocals', icon: '🎤' },
  { key: 'Master Bus', label: 'Buss', icon: '🔊' },
  { key: 'Master', label: 'Master', icon: 'M' },
];

const FORMATS = ['VST3', 'AU', 'AAX', 'STANDALONE', 'WEB'];
const PLATFORMS = ['LINUX', 'WINDOWS', 'macOS'];

const InfoCard: React.FC<{ title: string; value: string; sub?: string }> = ({ title, value, sub }) => (
  <div style={{
    background: 'linear-gradient(180deg, #1a1a1a, #111)', border: '1px solid #222',
    borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90,
  }}>
    <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
    <span style={{ fontSize: 14, color: NEON, fontWeight: 700 }}>{value}</span>
    {sub && <span style={{ fontSize: 9, color: '#666' }}>{sub}</span>}
  </div>
);

const HexBadge: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <div style={{
      width: 42, height: 42,
      background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)',
      border: '1px solid #333',
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 10px rgba(183,255,0,0.1)',
    }}>
      <span style={{ fontSize: 12, color: NEON, fontWeight: 800 }}>{icon}</span>
    </div>
    <span style={{ fontSize: 9, color: '#777', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
  </div>
);

export const R3V4Plugin: React.FC = () => {
  const store = useR3V4Store();
  const engineRef = useRef<R3V4AudioEngine | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [presetDisplay, setPresetDisplay] = useState(store.spaceMode.toUpperCase() + ' — ' + store.presetName.split('—').pop()?.trim());

  useEffect(() => {
    const engine = new R3V4AudioEngine();
    engineRef.current = engine;
    engine.onMetrics((metrics) => {
      setInputLevel(metrics.peakInputL || 0);
      setOutputLevel(metrics.peakOutputL || 0);
      setCpuUsage(metrics.cpuLoad || 0);
    });
    return () => engine.close();
  }, []);

  useEffect(() => {
    engineRef.current?.setParameters(store.parameters);
  }, [store.parameters]);

  useEffect(() => {
    const name = store.presetName.split('—').pop()?.trim() || store.presetName;
    setPresetDisplay(`${store.spaceMode.toUpperCase()} ${name.toUpperCase()}`);
  }, [store.presetName, store.spaceMode]);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleParamChange = useCallback((param: string, value: number | boolean) => {
    store.setParameter(param as any, value);
  }, [store]);

  const allPresets = useMemo(() => [...FACTORY_PRESETS, ...store.userPresets], [store.userPresets]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.loadPresetByName(e.target.value);
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: 'linear-gradient(180deg, #1a1a1a, #111)', border: `1px solid ${active ? '#444' : '#222'}`,
    color: active ? '#aaa' : '#555', padding: '6px 12px', borderRadius: 6, fontSize: 10,
    cursor: active ? 'pointer' : 'not-allowed', letterSpacing: 1, transition: 'all 0.2s',
  });

  const knobRows = [
    ['preDelay', 'Pre-Delay'], ['decay', 'Decay'], ['size', 'Size'], ['diffusion', 'Diffusion'],
    ['damping', 'Damping'], ['highCut', 'High Cut'], ['lowCut', 'Low Cut'], ['bassDamping', 'Bass Damp'],
    ['earlyReflections', 'Early Ref'], ['crosstalk', 'Crosstalk'], ['modulation', 'Modulation'], ['stereoWidth', 'Width'],
  ] as const;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: R3V4_COLORS.titaniumSilver,
      width: '100%', maxWidth: 1280, margin: '0 auto',
      borderRadius: 16, overflow: 'hidden',
      background: 'linear-gradient(135deg, #111 0%, #0a0a0a 50%, #111 100%)',
      border: '1px solid #333',
      boxShadow: '0 0 60px rgba(183,255,0,0.08), inset 0 0 80px rgba(0,0,0,0.8)',
      position: 'relative',
      opacity: store.isProcessing ? 1 : 0.45,
      transition: 'opacity 0.3s',
    }}>
      {/* Animated energy border */}
      <EnergyBorder />

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px',
        background: 'linear-gradient(90deg, #0d0d0d, #161616, #0d0d0d)',
        borderBottom: '1px solid #222',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* R3 NATIVE badge */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #c8ff33, #8acc00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(183,255,0,0.4), inset 0 0 6px rgba(0,0,0,0.3)',
            border: '2px solid #444',
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#080808', letterSpacing: -1 }}>R3</span>
          </div>

          <div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: NEON, letterSpacing: 3,
              textShadow: '0 0 12px rgba(183,255,0,0.5), 0 2px 0 #333',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)',
            }}>R3V4</div>
            <div style={{ fontSize: 10, color: '#666', letterSpacing: 4, fontWeight: 600 }}>REVERB ENGINE v1.0</div>
          </div>

          <div style={{
            fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
            fontSize: 22, color: '#D4AF37', fontStyle: 'italic',
            textShadow: '0 0 8px rgba(212,175,55,0.3)',
            marginLeft: 12,
          }}>By Dj Ernesto</div>
        </div>

        {/* Feature hex row */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {FEATURES.map(f => <HexBadge key={f.label} icon={f.icon} label={f.label} />)}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={store.undo} disabled={store.historyIndex <= 0} style={btnStyle(store.historyIndex > 0)}>↶ UNDO</button>
          <button onClick={store.redo} disabled={store.historyIndex >= store.history.length - 1} style={btnStyle(store.historyIndex < store.history.length - 1)}>↷ REDO</button>
          <button onClick={() => store.activeAB === 'A' ? store.captureStateA() : store.captureStateB()}
            style={{ ...btnStyle(true), borderColor: NEON, color: NEON }}>
            A / B
          </button>
          <button onClick={store.togglePower}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: store.isProcessing ? 'radial-gradient(circle at 30% 30%, #c8ff33, #6aa800)' : '#222',
              border: '2px solid #444', color: store.isProcessing ? '#080808' : '#555',
              fontSize: 18, cursor: 'pointer',
              boxShadow: store.isProcessing ? '0 0 24px rgba(183,255,0,0.5)' : 'inset 0 0 8px rgba(0,0,0,0.8)',
              transition: 'all 0.2s',
            }}>⏻</button>
        </div>
      </div>

      {/* PRESET BAR with arrow navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 28px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 2 }}>Preset</span>
        <button onClick={store.previousPreset}
          style={{ ...btnStyle(true), padding: '6px 10px', fontSize: 14 }}>◀</button>
        <div style={{
          flex: 1, maxWidth: 340, textAlign: 'center', padding: '8px 16px', borderRadius: 6,
          background: 'linear-gradient(90deg, #111, #1a1a1a, #111)', border: '1px solid #333',
          fontSize: 13, color: NEON, fontWeight: 700, letterSpacing: 2,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 0 8px rgba(183,255,0,0.05)',
        }}>{presetDisplay}</div>
        <button onClick={store.nextPreset}
          style={{ ...btnStyle(true), padding: '6px 10px', fontSize: 14 }}>▶</button>

        <select value={store.presetName} onChange={handlePresetChange}
          style={{ background: '#111', border: '1px solid #222', color: '#aaa', padding: '6px 12px', borderRadius: 6, fontSize: 11, maxWidth: 220 }}>
          {allPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>

        <button onClick={() => store.saveUserPreset(`Custom ${Date.now()}`, 'User')} style={btnStyle(true)}>💾 SAVE</button>
        <button onClick={store.randomize} style={btnStyle(true)}>🎲 RANDOM</button>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 560, background: 'linear-gradient(180deg, #0d0d0d, #080808)' }}>
        {/* LEFT PANEL */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: NEON, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Space Visualizer</span>
            <span style={{ fontSize: 11, color: '#666' }}>{store.spaceMode.toUpperCase()}</span>
          </div>
          <SpaceCube size={store.parameters.size} decay={store.parameters.decay} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {SPACE_MODES.map(mode => (
              <button key={mode} onClick={() => store.setSpaceMode(mode as SpaceMode)}
                style={{
                  background: store.spaceMode === mode ? 'linear-gradient(180deg, #1a1a1a, #111)' : '#0d0d0d',
                  border: `1px solid ${store.spaceMode === mode ? NEON : '#222'}`,
                  color: store.spaceMode === mode ? NEON : '#666',
                  padding: '8px 0', borderRadius: 6, fontSize: 9, cursor: 'pointer', letterSpacing: 1,
                  boxShadow: store.spaceMode === mode ? '0 0 10px rgba(183,255,0,0.1)' : 'none',
                }}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={() => {}}
            style={{
              background: 'linear-gradient(90deg, #111, #0f1a00)',
              border: `1px solid ${NEON}`, color: NEON,
              padding: 12, borderRadius: 8, fontSize: 11, cursor: 'pointer', letterSpacing: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 0 16px rgba(183,255,0,0.08)',
            }}>
            <span style={{ fontSize: 14 }}>✦</span> AI SMART MODE
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 12 knobs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 8px',
            padding: 18, background: 'linear-gradient(180deg, #111, #0a0a0a)', borderRadius: 12,
            border: '1px solid #1a1a1a',
          }}>
            {knobRows.map(([param, label]) => (
              <Knob key={param}
                value={store.parameters[param as keyof typeof store.parameters] as number}
                range={PARAMETER_RANGES[param]}
                label={label}
                onChange={(v) => handleParamChange(param, v)}
                size={64}
              />
            ))}
          </div>

          {/* Mix section: faders + stereo width */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 20,
            padding: 18, background: 'linear-gradient(180deg, #111, #0a0a0a)', borderRadius: 12,
            border: '1px solid #1a1a1a', alignItems: 'end',
          }}>
            <Fader value={store.parameters.dry} label="DRY" onChange={(v) => handleParamChange('dry', v)} />
            <Fader value={store.parameters.er} label="ER" onChange={(v) => handleParamChange('er', v)} />
            <Fader value={store.parameters.wet} label="WET" onChange={(v) => handleParamChange('wet', v)} />
            <StereoWidthSlider value={store.parameters.stereoWidth} min={0} max={200}
              onChange={(v) => handleParamChange('stereoWidth', v)} />
          </div>

          {/* Toggle buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { param: 'freeze', icon: '❄️', label: 'Freeze', sub: 'Infinite' },
              { param: 'ducking', icon: '🔽', label: 'Ducking', sub: 'Auto-lower' },
              { param: 'tempoSync', icon: '⏱️', label: 'Tempo Sync', sub: 'BPM Lock' },
              { param: 'oversampling', icon: '🔬', label: 'Oversample', sub: '2x' },
            ].map(({ param, icon, label, sub }) => {
              const active = store.parameters[param as keyof typeof store.parameters] as boolean;
              return (
                <button key={param}
                  onClick={() => handleParamChange(param, !active)}
                  style={{
                    background: active ? 'linear-gradient(180deg, #1a1a1a, #0f1a00)' : 'linear-gradient(180deg, #111, #0a0a0a)',
                    border: `1px solid ${active ? NEON : '#222'}`,
                    color: active ? NEON : '#666',
                    padding: 12, borderRadius: 8, fontSize: 10, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    boxShadow: active ? '0 0 12px rgba(183,255,0,0.1)' : 'none',
                  }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span>{label}</span>
                  <span style={{ fontSize: 9, color: '#444' }}>{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM INFO PANEL */}
      <div style={{
        display: 'flex', gap: 10, padding: '14px 28px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a',
        overflowX: 'auto',
      }}>
        <InfoCard title="Space" value={store.spaceMode.toUpperCase()} sub={store.presetName} />
        <InfoCard title="Size" value={`${Math.round(store.parameters.size)}%`} sub="Room dimensions" />
        <InfoCard title="High Cut" value={PARAMETER_RANGES.highCut.displayFormat(store.parameters.highCut)} sub="Reverb tail LPF" />
        <InfoCard title="Stereo Width" value={`${Math.round(store.parameters.stereoWidth)}%`} sub="Mono → Ultra Wide" />
        <InfoCard title="Presets" value={`${FACTORY_PRESETS.length + store.userPresets.length}`} sub="Factory + User" />
      </div>

      {/* PRO TIPS BAR */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
        padding: '14px 28px', background: 'linear-gradient(90deg, #0d0d0d, #111, #0d0d0d)', borderTop: '1px solid #1a1a1a',
      }}>
        {TIPS.map((tip, i) => {
          const active = i === tipIndex;
          return (
            <div key={tip.title} style={{
              background: active ? 'linear-gradient(180deg, #1a1a1a, #0f1a00)' : '#111',
              border: `1px solid ${active ? NEON : '#222'}`, borderRadius: 8, padding: 10,
              opacity: active ? 1 : 0.6,
              boxShadow: active ? '0 0 12px rgba(183,255,0,0.08)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: active ? NEON : '#666' }}>{tip.icon}</span>
                <span style={{ fontSize: 10, color: active ? NEON : '#888', fontWeight: 700, textTransform: 'uppercase' }}>{tip.title}</span>
              </div>
              <span style={{ fontSize: 9, color: '#666', lineHeight: 1.4 }}>{tip.body}</span>
            </div>
          );
        })}
      </div>

      {/* STATUS BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', background: '#080808', borderTop: '1px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Meter level={inputLevel} label="Input" />
          <Meter level={outputLevel} label="Output" />
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Stat label="CPU" value={`${cpuUsage.toFixed(1)}%`} color={NEON} />
          <Stat label="Latency" value="2.1 ms" />
          <Stat label="Oversample" value={`${store.parameters.oversampling ? '2x' : '1x'}`} />
          <Stat label="Sample Rate" value={`${store.sampleRate / 1000} kHz`} />
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '18px 28px', background: 'linear-gradient(90deg, #0a0a0a, #111, #0a0a0a)', borderTop: '1px solid #222',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {PLATFORMS.map(p => (
              <span key={p} style={{ fontSize: 9, color: '#555', border: '1px solid #222', padding: '3px 8px', borderRadius: 4 }}>{p}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {FORMATS.map(f => (
              <span key={f} style={{ fontSize: 9, color: NEON, border: `1px solid ${NEON}33`, padding: '3px 8px', borderRadius: 4, background: '#0f1a00' }}>{f}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center', paddingTop: 4 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key}
              onClick={() => store.loadFirstPresetByCategory(cat.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', cursor: 'pointer', color: '#888',
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(180deg, #1a1a1a, #111)', border: '1px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 8px rgba(183,255,0,0.05)',
              }}>
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
              </div>
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#666' }}>{cat.label}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: '#444', letterSpacing: 2 }}>
          R3 NATIVE LABS — PROPRIETARY SPATIAL PROCESSOR
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ fontSize: 9, color: '#555' }}>{label}</span>
    <div style={{ fontSize: 12, color: color || R3V4_COLORS.titaniumSilver, fontWeight: 700 }}>{value}</div>
  </div>
);

const EnergyBorder: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#B7FF00';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 12;
      ctx.beginPath();

      const points = 40;
      for (let i = 0; i <= points; i++) {
        const pct = i / points;
        let x, y;
        if (pct < 0.25) {
          x = pct * 4 * w; y = 0;
        } else if (pct < 0.5) {
          x = w; y = (pct - 0.25) * 4 * h;
        } else if (pct < 0.75) {
          x = w - (pct - 0.5) * 4 * w; y = h;
        } else {
          x = 0; y = h - (pct - 0.75) * 4 * h;
        }
        const wave = Math.sin(pct * 20 + t) * 4 + Math.sin(pct * 7 - t * 0.5) * 3;
        if (pct < 0.25) y += wave;
        else if (pct < 0.5) x -= wave;
        else if (pct < 0.75) y -= wave;
        else x += wave;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 16, overflow: 'hidden' }} />
  );
};
