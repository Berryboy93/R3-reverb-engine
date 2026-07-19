import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useR3V4Store } from '../lib/store';
import { R3V4_COLORS, PARAMETER_RANGES, SPACE_MODES } from '../types/reverb';
import { FACTORY_PRESETS } from '../lib/presets';
import { Knob } from './components/Knob';
import { Fader } from './components/Fader';
import { Meter } from './components/Meter';
import { R3V4AudioEngine } from '../lib/audioEngine';

const TIPS = [
  'Pre-Delay preserves attack transients while adding space. Increase for vocals, decrease for drums.',
  'EQ the Reverb: High-pass and low-pass the reverb return to maintain mix clarity.',
  'Parallel Reverb: Blend ambience using auxiliary buses for maximum control.',
  'Short Decays improve clarity for drums and rhythm instruments.',
  'Long Decays create cinematic textures and atmospheric pads.',
  'Diffusion controls reflection density — low for echoes, high for smooth ambient tail.',
  'Damping simulates wall absorption — higher for warmer tails, lower for brighter reflections.',
  'Stereo Width from Mono to Ultra Wide controls perceived spatial image.',
  'Bass Damping reduces excessive low-frequency buildup in the reverb tail.',
  'Early Reflections define the character of the space before the decay begins.',
];

export const R3V4Plugin: React.FC = () => {
  const store = useR3V4Store();
  const engineRef = useRef<R3V4AudioEngine | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);

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
    const interval = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleParamChange = useCallback((param: string, value: number | boolean) => {
    store.setParameter(param as any, value);
  }, [store]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.loadPresetByName(e.target.value);
  };

  const allPresets = [...FACTORY_PRESETS, ...store.userPresets];

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: '#1a1a1a', border: `1px solid ${active ? R3V4_COLORS.graphite : '#222'}`,
    color: active ? R3V4_COLORS.textSecondary : '#444', padding: '6px 14px',
    borderRadius: 6, fontSize: 11, cursor: active ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
  });

  return (
    <div style={{
      fontFamily: 'var(--kimi-font-sans, system-ui, sans-serif)',
      color: R3V4_COLORS.titaniumSilver, width: '100%', maxWidth: 1200,
      margin: '0 auto', background: R3V4_COLORS.midnightBlack,
      borderRadius: 12, overflow: 'hidden', border: `1px solid ${R3V4_COLORS.graphite}`,
      boxShadow: '0 0 40px rgba(183,255,0,0.08)',
      opacity: store.isProcessing ? 1 : 0.4, transition: 'opacity 0.3s',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'linear-gradient(90deg, #080808 0%, #0f0f0f 50%, #080808 100%)',
        borderBottom: `1px solid ${R3V4_COLORS.graphite}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: R3V4_COLORS.neonNativeGreen,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: R3V4_COLORS.midnightBlack, fontSize: 14,
            boxShadow: '0 0 16px rgba(183,255,0,0.4)',
          }}>R3</div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: R3V4_COLORS.neonNativeGreen,
              letterSpacing: 2, textShadow: '0 0 10px rgba(183,255,0,0.3)',
            }}>R3V4 REVERB ENGINE</div>
            <div style={{ fontSize: 10, color: '#666', letterSpacing: 3 }}>SPATIAL PROCESSOR v1.0</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={store.undo} disabled={store.historyIndex <= 0}
            style={btnStyle(store.historyIndex > 0)}>↶ UNDO</button>
          <button onClick={store.redo} disabled={store.historyIndex >= store.history.length - 1}
            style={btnStyle(store.historyIndex < store.history.length - 1)}>↷ REDO</button>
          <button onClick={() => store.activeAB === 'A' ? store.captureStateA() : store.captureStateB()}
            style={{ ...btnStyle(true), borderColor: R3V4_COLORS.neonNativeGreen, color: R3V4_COLORS.neonNativeGreen }}>
            A / B
          </button>
          <button onClick={store.togglePower}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: store.isProcessing ? R3V4_COLORS.neonNativeGreen : '#333',
              border: 'none', color: store.isProcessing ? R3V4_COLORS.midnightBlack : '#666',
              fontSize: 16, cursor: 'pointer',
              boxShadow: store.isProcessing ? '0 0 20px rgba(183,255,0,0.5)' : 'none',
            }}>⏻</button>
        </div>
      </div>

      {/* PRESET BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', background: '#0c0c0c', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 2 }}>Preset</span>
        <select value={store.presetName} onChange={handlePresetChange}
          style={{ background: '#1a1a1a', border: `1px solid ${R3V4_COLORS.graphite}`, color: R3V4_COLORS.titaniumSilver, padding: '6px 12px', borderRadius: 6, fontSize: 12, flex: 1, maxWidth: 300 }}>
          {allPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <button onClick={() => store.saveUserPreset(`Custom ${Date.now()}`, 'User')} style={btnStyle(true)}>💾 SAVE</button>
        <button onClick={store.randomize} style={btnStyle(true)}>🎲 RANDOM</button>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 520 }}>
        <div style={{ background: '#0a0a0a', borderRight: '1px solid #1a1a1a', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: R3V4_COLORS.neonNativeGreen, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Space Visualizer</span>
            <span style={{ fontSize: 11, color: '#666' }}>{store.spaceMode.toUpperCase()}</span>
          </div>
          <SpaceVisualizer mode={store.spaceMode} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {SPACE_MODES.map(mode => (
              <button key={mode} onClick={() => store.setSpaceMode(mode)}
                style={{
                  background: store.spaceMode === mode ? '#1a1a1a' : '#111',
                  border: `1px solid ${store.spaceMode === mode ? R3V4_COLORS.neonNativeGreen : R3V4_COLORS.graphite}`,
                  color: store.spaceMode === mode ? R3V4_COLORS.neonNativeGreen : '#666',
                  padding: '8px 0', borderRadius: 6, fontSize: 10, cursor: 'pointer', letterSpacing: 1,
                }}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={() => {}}
            style={{
              background: 'linear-gradient(90deg, #1a1a1a, #0f1a00)',
              border: `1px solid ${R3V4_COLORS.neonNativeGreen}`, color: R3V4_COLORS.neonNativeGreen,
              padding: 10, borderRadius: 8, fontSize: 11, cursor: 'pointer', letterSpacing: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <span style={{ fontSize: 14 }}>✦</span> AI SMART MODE
          </button>
        </div>

        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignContent: 'start' }}>
          {[
            ['preDelay', 'Pre-Delay'], ['decay', 'Decay'], ['size', 'Size'], ['diffusion', 'Diffusion'],
            ['damping', 'Damping'], ['highCut', 'High Cut'], ['lowCut', 'Low Cut'], ['bassDamping', 'Bass Damp'],
            ['stereoWidth', 'Width'], ['earlyReflections', 'Early Ref'], ['crosstalk', 'Crosstalk'], ['modulation', 'Modulation'],
          ].map(([param, label]) => (
            <Knob key={param}
              value={store.parameters[param as keyof typeof store.parameters] as number}
              range={PARAMETER_RANGES[param]}
              label={label}
              onChange={(v) => handleParamChange(param, v)}
            />
          ))}

          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 12, background: '#0c0c0c', borderRadius: 10, border: '1px solid #1a1a1a' }}>
            <Fader value={store.parameters.dry} label="DRY" onChange={(v) => handleParamChange('dry', v)} />
            <Fader value={store.parameters.er} label="ER" onChange={(v) => handleParamChange('er', v)} />
            <Fader value={store.parameters.wet} label="WET" onChange={(v) => handleParamChange('wet', v)} />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 12, background: '#0c0c0c', borderRadius: 10, border: '1px solid #1a1a1a' }}>
            {[
              { param: 'freeze', icon: '❄️', label: 'Freeze', sub: 'Infinite' },
              { param: 'ducking', icon: '🔽', label: 'Ducking', sub: 'Auto-lower' },
              { param: 'tempoSync', icon: '⏱️', label: 'Tempo Sync', sub: 'BPM Lock' },
              { param: 'oversampling', icon: '🔬', label: 'Oversample', sub: '2x' },
            ].map(({ param, icon, label, sub }) => (
              <button key={param}
                onClick={() => handleParamChange(param, !store.parameters[param as keyof typeof store.parameters])}
                style={{
                  background: store.parameters[param as keyof typeof store.parameters] ? '#1a1a1a' : '#111',
                  border: `1px solid ${store.parameters[param as keyof typeof store.parameters] ? R3V4_COLORS.neonNativeGreen : R3V4_COLORS.graphite}`,
                  color: store.parameters[param as keyof typeof store.parameters] ? R3V4_COLORS.neonNativeGreen : '#666',
                  padding: 10, borderRadius: 8, fontSize: 10, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
                <span style={{ fontSize: 9, color: '#444' }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Meter level={inputLevel} label="Input" />
          <Meter level={outputLevel} label="Output" />
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Stat label="CPU" value={`${cpuUsage.toFixed(1)}%`} color={R3V4_COLORS.neonNativeGreen} />
          <Stat label="Latency" value="2.1 ms" />
          <Stat label="Oversample" value={`${store.parameters.oversampling ? '2x' : '1x'}`} />
          <Stat label="Sample Rate" value={`${store.sampleRate / 1000} kHz`} />
        </div>
      </div>

      {/* TIPS */}
      <div style={{ padding: '10px 24px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: R3V4_COLORS.neonNativeGreen, fontWeight: 700 }}>💡 TIP:</span>
        <span>{TIPS[tipIndex]}</span>
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

const SpaceVisualizer: React.FC<{ mode: string }> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef(Array.from({ length: 40 }, () => ({
    x: Math.random() * 280, y: Math.random() * 200,
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    r: Math.random() * 2 + 0.5, alpha: Math.random(),
  })));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const draw = () => {
      const w = 280, h = 200;
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);

      const roomSize = mode === 'Infinite' ? 0.95 : mode === 'Hall' ? 0.8 : mode === 'Room' ? 0.5 : 0.65;
      const rw = w * roomSize, rh = h * roomSize * 0.7;
      const rx = (w - rw) / 2, ry = (h - rh) / 2 + 10;

      ctx.strokeStyle = '#B7FF00';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.strokeRect(rx, ry, rw, rh);

      const bw = rw * 0.6, bh = rh * 0.6;
      const bx = (w - bw) / 2, by = ry - bh * 0.3;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(bx, by);
      ctx.moveTo(rx + rw, ry); ctx.lineTo(bx + bw, by);
      ctx.moveTo(rx, ry + rh); ctx.lineTo(bx, by + bh);
      ctx.moveTo(rx + rw, ry + rh); ctx.lineTo(bx + bw, by + bh);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 20, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#B7FF00';
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.alpha += (Math.random() - 0.5) * 0.05;
        p.alpha = Math.max(0.1, Math.min(0.8, p.alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183,255,0,${p.alpha})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(183,255,0,0.4)';
      ctx.lineWidth = 1.5;
      for (let x = 20; x < w - 20; x++) {
        const t = (x - 20) / (w - 40);
        const decay = Math.exp(-t * 4);
        const y = h - 30 - decay * 40 * Math.sin(t * 30) * (1 + Math.random() * 0.1);
        if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [mode]);

  return <canvas ref={canvasRef} width={280} height={200} style={{ width: '100%', height: 200, background: '#080808', borderRadius: 10, border: '1px solid #1a1a1a' }} />;
};
