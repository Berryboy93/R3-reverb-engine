/**
 * @component R3V4Plugin
 * @origin Replit
 * @replit-project R3V4 Reverb Engine (Replit prototype)
 * @integrated 2026-07-20
 * @integrated-by r3v
 * @tier All
 * @llpte-connected false
 * @vcm-connected false
 * @plugin-host-connected false
 * @audit-status Phase10
 * @deferred-findings none
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useR3V4Store } from '../lib/store';
import { R3V4_COLORS, R3V4_FONTS, PARAMETER_RANGES, SPACE_MODES, SpaceMode } from '../types/reverb';
import { FACTORY_PRESETS } from '../lib/presets';
import { R3V4AudioEngine, InputSource } from '../lib/audioEngine';
import { Knob } from './components/Knob';
import { Fader } from './components/Fader';
import { Meter } from './components/Meter';
import { SpaceCube } from './components/SpaceCube';
import { StereoWidthSlider } from './components/StereoWidthSlider';

const NEON = R3V4_COLORS.neonNativeGreen;
const GOLD = '#D4AF37';

/* ─── Glass panel helper ───────────────────────────────────────────── */
const glass = (alpha = 0.55, blur = 8): React.CSSProperties => ({
  background: `rgba(12,12,12,${alpha})`,
  backdropFilter: `blur(${blur}px) saturate(1.4)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
});

/* ─── ASI circuit trace overlay (SVG pattern) ──────────────────────── */
const CircuitOverlay: React.FC = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.045, zIndex: 0 }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <path d="M10 10 H40 V30 H70" stroke="#B7FF00" strokeWidth="0.8" fill="none"/>
        <path d="M40 10 V60 H60 V70" stroke="#B7FF00" strokeWidth="0.8" fill="none"/>
        <path d="M0 50 H20 V40 H50" stroke="#B7FF00" strokeWidth="0.8" fill="none"/>
        <circle cx="40" cy="30" r="2" fill="#B7FF00"/>
        <circle cx="20" cy="40" r="1.5" fill="#B7FF00"/>
        <circle cx="60" cy="70" r="2" fill="#B7FF00"/>
        <rect x="8" y="8" width="4" height="4" rx="1" fill="none" stroke="#B7FF00" strokeWidth="0.6"/>
        <rect x="68" y="28" width="4" height="4" rx="1" fill="none" stroke="#B7FF00" strokeWidth="0.6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#circuit)"/>
  </svg>
);

/* ─── Animated laser border ─────────────────────────────────────────── */
// Three-layer HDR render: wide diffuse halo → mid corona → sharp bright core.
// Corner nodes pulse independently as spark accents.
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

    const getPoint = (p: number, w: number, h: number) => {
      let x = 0, y = 0;
      if (p < 0.25)      { x = p * 4 * w;           y = 0; }
      else if (p < 0.5)  { x = w;                    y = (p - 0.25) * 4 * h; }
      else if (p < 0.75) { x = w - (p - 0.5) * 4 * w; y = h; }
      else               { x = 0;                    y = h - (p - 0.75) * 4 * h; }
      // Compound wave for organic laser wobble
      const wave = Math.sin(p * 20 + t) * 4.5 + Math.sin(p * 7 - t * 0.65) * 2.5;
      if (p < 0.25)      y += wave;
      else if (p < 0.5)  x -= wave;
      else if (p < 0.75) y -= wave;
      else               x += wave;
      return { x, y };
    };

    const tracePath = (pts: number, w: number, h: number) => {
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const { x, y } = getPoint(i / pts, w, h);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const draw = () => {
      t += 0.022;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);
      const pts = 80;

      // Layer 1 — wide diffuse halo
      tracePath(pts, w, h);
      ctx.strokeStyle = `rgba(183,255,0,${0.06 + pulse * 0.05})`;
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 22;
      ctx.stroke();

      // Layer 2 — mid corona
      tracePath(pts, w, h);
      ctx.strokeStyle = `rgba(183,255,0,${0.18 + pulse * 0.10})`;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Layer 3 — sharp bright laser core
      tracePath(pts, w, h);
      ctx.strokeStyle = `rgba(215,255,100,${0.70 + pulse * 0.28})`;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#D7FF64';
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Corner spark nodes — each pulses at a different phase
      const corners = [
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: h }, { x: 0, y: h },
      ];
      corners.forEach(({ x, y }, i) => {
        const sp = 0.5 + 0.5 * Math.sin(t * 2.2 + i * Math.PI * 0.5);
        // Outer diffuse spark
        ctx.beginPath();
        ctx.arc(x, y, 6 + sp * 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183,255,0,${0.05 + sp * 0.08})`;
        ctx.fill();
        // Bright node core
        ctx.beginPath();
        ctx.arc(x, y, 2 + sp * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,255,120,${0.55 + sp * 0.42})`;
        ctx.shadowColor = '#B7FF00';
        ctx.shadowBlur = 8 + sp * 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 14, zIndex: 2 }} />
  );
};

/* ─── ASI chip badge (octagonal) ───────────────────────────────────── */
const ASIBadge: React.FC<{ icon: string; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
    <div style={{
      width: 32, height: 32,
      clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
      background: active
        ? `linear-gradient(135deg, rgba(183,255,0,0.18), rgba(0,0,0,0.7))`
        : 'linear-gradient(135deg, #1c1c1c, #0a0a0a)',
      border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? `0 0 12px rgba(183,255,0,0.2)` : 'none',
      position: 'relative',
    }}>
      <span style={{ fontSize: 9, color: active ? NEON : '#666', fontWeight: 900, letterSpacing: 0.5 }}>{icon}</span>
    </div>
    <span style={{ fontSize: 7.5, color: active ? '#999' : '#444', textTransform: 'uppercase', letterSpacing: 1.2 }}>{label}</span>
  </div>
);

/* ─── Section label ─────────────────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontFamily: R3V4_FONTS.display,
    fontSize: 10, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: 2.5,
    textShadow: '0 1px 0 rgba(0,0,0,0.8)',
  }}>{children}</span>
);


/* ─── Stat ──────────────────────────────────────────────────────────── */
const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 11, color: color || '#888', fontWeight: 700 }}>{value}</div>
  </div>
);


const FEATURES: { icon: string; label: string }[] = [
  { icon: 'AI', label: 'Smart AI' },
  { icon: '3D', label: 'Spatial' },
  { icon: 'FDN', label: '8×8 Matrix' },
  { icon: '2x', label: 'Oversample' },
  { icon: 'RT', label: 'Real-Time' },
  { icon: 'LOW', label: 'Low CPU' },
];

const CATEGORIES = [
  { key: 'Drums', label: 'Drums', icon: '▶' },
  { key: 'Keys', label: 'Keys', icon: '◆' },
  { key: 'Vocals', label: 'Vocals', icon: '◉' },
  { key: 'Master Bus', label: 'Buss', icon: '◈' },
  { key: 'Master', label: 'Master', icon: 'M' },
];


const AUDIO_CONSENT_KEY = 'r3v4-audio-consent';

export const R3V4Plugin: React.FC = () => {
  const store = useR3V4Store();
  const engineRef = useRef<R3V4AudioEngine | null>(null);
  const isUnlockingRef = useRef(false);
  // True while the user has *intentionally* paused audio (Audio button toggle).
  // Distinguishes deliberate pauses from browser-driven suspensions so the
  // unlock banner (and its click-anywhere listener) doesn't re-arm and
  // silently restart audio against the user's will.
  const userPausedRef = useRef(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  // True until the user has successfully started audio (shows the unlock banner)
  const [needsFirstGesture, setNeedsFirstGesture] = useState(true);
  // True when AudioContext creation failed outright (unsupported / permanently blocked).
  // Distinct from needsFirstGesture so we can show an actionable error instead of
  // the "click to enable" prompt (which would be misleading — clicking won't help).
  const [audioBlocked, setAudioBlocked] = useState(false);
  // Whether the user has previously consented to audio (persisted in localStorage)
  const [hasStoredConsent] = useState(() => localStorage.getItem(AUDIO_CONSENT_KEY) === '1');
  const [audioStatus, setAudioStatus] = useState('Audio off');
  const [inputSource, setInputSource] = useState<InputSource>(
    () => (localStorage.getItem('r3v4-input-source') as InputSource | null) ?? 'test-tone'
  );
  const [presetDisplay, setPresetDisplay] = useState('');
  const [asiPulse, setAsiPulse] = useState(false);

  useEffect(() => {
    const engine = new R3V4AudioEngine();
    engineRef.current = engine;
    engine.onMetrics((m) => {
      setInputLevel(m.peakInputL || 0);
      setOutputLevel(m.peakOutputL || 0);
      setCpuUsage(m.cpuLoad || 0);
    });
    // React to browser-driven state transitions (e.g. tab backgrounded, power-save,
    // or the Firefox/Safari quirk where state is 'running' but audio is still gated
    // and then transitions to 'suspended' before the first real sample plays).
    engine.onStateChange((state) => {
      const running = state === 'running';
      setAudioEnabled(running);
      if (!running) {
        if (userPausedRef.current) {
          // The user paused on purpose — do NOT re-arm the unlock banner,
          // otherwise any subsequent click would silently restart audio.
          setAudioStatus('Paused');
          store.setProcessing(false);
          return;
        }
        // Context was suspended outside our control — show the unlock banner again
        // so the user knows a click is required to resume.
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
    const iv = setInterval(() => setAsiPulse(p => !p), 1800);
    return () => clearInterval(iv);
  }, []);

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
      if (running) {
        // Persist consent so future loads can auto-unlock on first interaction
        localStorage.setItem(AUDIO_CONSENT_KEY, '1');
      }
      // The engine may have silently fallen back to test tone (mic denied);
      // sync the UI so the dropdown/status never lie about the active source.
      setInputSource(e.getInputSource());
      applyAudioRunningState(running);
    } else {
      // Initialization failed outright — AudioContext couldn't be created or the
      // worklet couldn't load. This is different from "waiting for a gesture":
      // clicking again won't help. Show an actionable error and stop the banner.
      setAudioBlocked(true);
      setNeedsFirstGesture(false);
      setAudioStatus('Audio unavailable');
      store.setProcessing(false);
    }
  }, [inputSource, applyAudioRunningState, store]);

  // Unified unlock: handles both first-time init and resuming a suspended context.
  // isUnlockingRef prevents concurrent calls from racing (e.g. banner + document listener).
  const unlockAudio = useCallback(async () => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    try {
      const e = engineRef.current;
      if (!e) return;
      if (!e.initialized) {
        await enableAudio();
      } else {
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
    // Mark intent BEFORE suspending so the statechange handler can tell a
    // deliberate pause apart from a browser-driven suspension.
    if (e.isRunning) userPausedRef.current = true;
    else userPausedRef.current = false;
    await e.toggle();
    const running = e.isRunning;
    setAudioEnabled(running);
    if (running) setNeedsFirstGesture(false);
    setAudioStatus(running ? (e.getInputSource() === 'mic' ? 'Microphone' : 'Test Tone') : 'Paused');
    store.setProcessing(running);
  }, [unlockAudio, store]);

  // showAudioBanner is ONLY true while awaiting the very first user gesture (browser autoplay).
  // It must NOT re-activate when the user intentionally powers audio off — that would cause any
  // subsequent click to silently restart audio against the user's will.
  // Also suppress it if audio is fully blocked — that banner has its own UI.
  const showAudioBanner = needsFirstGesture && !audioBlocked;

  // Auto-unlock: attach gesture listener(s) while the banner is showing.
  // Returning users (hasStoredConsent) get mousedown+keydown so any interaction
  // with the plugin (e.g. touching a knob) triggers the unlock automatically.
  // First-time users keep the original click-only behaviour.
  useEffect(() => {
    if (!showAudioBanner) return;
    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      unlockAudio();
    };
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

  const changeInputSource = async (source: InputSource) => {
    setInputSource(source);
    localStorage.setItem('r3v4-input-source', source);
    const e = engineRef.current;
    if (!e) return;
    if (e.initialized) {
      await e.setInputSource(source);
      // Engine may fall back to test tone when the mic is denied — reflect reality.
      const actual = e.getInputSource();
      setInputSource(actual);
      localStorage.setItem('r3v4-input-source', actual);
      setAudioStatus(actual === 'mic' ? 'Microphone' : (source === 'mic' ? 'Mic denied — test tone' : 'Test Tone'));
    }
  };

  useEffect(() => { engineRef.current?.setParameters(store.parameters); }, [store.parameters]);

  useEffect(() => {
    const name = store.presetName.split('—').pop()?.trim() || store.presetName;
    setPresetDisplay(`${store.spaceMode.toUpperCase()} ${name.toUpperCase()}`);
  }, [store.presetName, store.spaceMode]);


  const handleParamChange = useCallback((param: string, value: number | boolean) => {
    store.setParameter(param as any, value);
  }, [store]);

  const allPresets = useMemo(() => [...FACTORY_PRESETS, ...store.userPresets], [store.userPresets]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => store.loadPresetByName(e.target.value);

  const btnBase: React.CSSProperties = {
    ...glass(0.65, 4),
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#666', padding: '4px 10px', borderRadius: 5, fontSize: 9,
    cursor: 'pointer', letterSpacing: 1, transition: 'all 0.18s',
  };
  const btnActive: React.CSSProperties = { ...btnBase, borderColor: '#444', color: '#aaa' };

  const knobRows = [
    ['preDelay', 'Pre-Delay'], ['decay', 'Decay'], ['size', 'Size'], ['diffusion', 'Diffusion'],
    ['damping', 'Damping'], ['highCut', 'High Cut'], ['lowCut', 'Low Cut'], ['bassDamping', 'Bass Damp'],
    ['earlyReflections', 'Early Ref'], ['crosstalk', 'Crosstalk'], ['modulation', 'Modulation'], ['stereoWidth', 'Width'],
  ] as const;

  return (
    <div style={{
      fontFamily: R3V4_FONTS.body,
      color: R3V4_COLORS.titaniumSilver,
      width: '100%', maxWidth: 1020, margin: '0 auto',
      aspectRatio: '16 / 9',
      display: 'flex', flexDirection: 'column',
      borderRadius: 14, overflow: 'hidden',
      // Skin texture base
      backgroundImage: [
        'linear-gradient(160deg, rgba(8,8,8,0.82) 0%, rgba(4,4,4,0.9) 50%, rgba(8,8,8,0.82) 100%)',
        'url(/skin-texture.png)',
      ].join(', '),
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundBlendMode: 'normal, overlay',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: [
        '0 0 60px rgba(183,255,0,0.05)',
        '0 30px 80px rgba(0,0,0,0.9)',
        'inset 0 1px 0 rgba(255,255,255,0.06)',
        'inset 0 0 80px rgba(0,0,0,0.7)',
      ].join(', '),
      position: 'relative',
      opacity: store.isProcessing ? 1 : 0.42,
      transition: 'opacity 0.35s ease',
    }}>
      {/* ASI circuit overlay */}
      <CircuitOverlay />
      {/* Animated neon border */}
      <EnergyBorder />

      {/* ── AUTOPLAY UNLOCK BANNER ───────────────────────────────────── */}
      {showAudioBanner && (
        <div
          style={{
            // In normal flow (not absolute) so it pushes the header down instead
            // of overlapping the header badges/controls.
            position: 'relative', zIndex: 200,
            background: 'linear-gradient(90deg, rgba(183,255,0,0.10), rgba(0,0,0,0.85), rgba(183,255,0,0.10))',
            borderBottom: '1px solid rgba(183,255,0,0.35)',
            borderRadius: '14px 14px 0 0',
            padding: '9px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            animation: 'r3v4-pulse 2s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: 13, color: NEON, lineHeight: 1 }}>⚠</span>
          <span style={{
            fontSize: 10, color: NEON, fontWeight: 700,
            letterSpacing: 2.5, textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(183,255,0,0.6)',
          }}>
            Click anywhere to enable audio
          </span>
          <span style={{ fontSize: 8.5, color: 'rgba(183,255,0,0.5)', letterSpacing: 1 }}>
            — browser autoplay policy requires a user gesture —
          </span>
        </div>
      )}

      {/* ── AUDIO BLOCKED / UNAVAILABLE BANNER ──────────────────────── */}
      {/* Shown when AudioContext creation failed outright — clicking again       */}
      {/* won't fix it, so we give the user an actionable fix instead.           */}
      {audioBlocked && (
        <div
          style={{
            position: 'relative', zIndex: 200,
            background: 'linear-gradient(90deg, rgba(220,50,50,0.18), rgba(0,0,0,0.90), rgba(220,50,50,0.18))',
            borderBottom: '1px solid rgba(220,80,80,0.45)',
            borderRadius: '14px 14px 0 0',
            padding: '10px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            backdropFilter: 'blur(10px)',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>🔇</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <span style={{
              fontSize: 10, color: '#ff6b6b', fontWeight: 700,
              letterSpacing: 2, textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(255,80,80,0.5)',
            }}>
              Audio blocked by browser
            </span>
            <span style={{ fontSize: 8.5, color: 'rgba(255,140,140,0.65)', letterSpacing: 0.8 }}>
              Allow audio in your browser settings, then reload the page
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 8,
              background: 'rgba(220,50,50,0.25)',
              border: '1px solid rgba(220,80,80,0.5)',
              borderRadius: 5,
              color: '#ff9999',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              padding: '5px 12px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Reload
          </button>
        </div>
      )}

      {/* ── HEADER (condensed per engineering standard) ─────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 16px',
        ...glass(0.78, 12),
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'radial-gradient(circle at 32% 28%, #d4ff55, #7ab800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(183,255,0,0.45), inset 0 0 6px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#060606', letterSpacing: -0.5 }}>R3</span>
          </div>

          <div>
            <div style={{
              fontFamily: R3V4_FONTS.display,
              fontSize: 22, fontWeight: 400, color: NEON, letterSpacing: 4,
              textShadow: `0 0 14px rgba(183,255,0,0.55), 0 2px 0 #111`,
              WebkitTextStroke: '0.5px rgba(255,255,255,0.12)',
              lineHeight: 1,
            }}>R3V4</div>
            <div style={{ fontSize: 8.5, color: '#444', letterSpacing: 3, fontWeight: 600 }}>REVERB ENGINE v1.0</div>
          </div>

          <div style={{
            fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
            fontSize: 17, color: GOLD, fontStyle: 'italic',
            textShadow: `0 0 8px rgba(212,175,55,0.35)`,
            marginLeft: 8, opacity: 0.92,
          }}>By Dj Ernesto</div>
        </div>

        {/* ASI feature chips */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {FEATURES.map(f => <ASIBadge key={f.label} icon={f.icon} label={f.label} active={store.isProcessing} />)}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Undo</span>
            <button onClick={store.undo} disabled={store.historyIndex <= 0}
              style={{ ...store.historyIndex > 0 ? btnActive : btnBase }}>↶</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Redo</span>
            <button onClick={store.redo} disabled={store.historyIndex >= store.history.length - 1}
              style={{ ...store.historyIndex < store.history.length - 1 ? btnActive : btnBase }}>↷</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>A / B</span>
            <button onClick={() => store.activeAB === 'A' ? store.captureStateA() : store.captureStateB()}
              style={{ ...btnActive, borderColor: NEON, color: NEON }}>A/B</button>
          </div>

          {/* Input source */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Input</span>
            <select value={inputSource} onChange={(e) => changeInputSource(e.target.value as InputSource)}
              style={{ ...glass(0.7, 4), border: '1px solid rgba(255,255,255,0.07)', color: '#888', padding: '4px 8px', borderRadius: 5, fontSize: 9 }}>
              <option value="test-tone">Test Tone</option>
              <option value="mic">Microphone</option>
            </select>
          </div>

          {/* Audio enable */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Audio</span>
            <button onClick={toggleAudio} style={{
              padding: '5px 12px', borderRadius: 5, fontSize: 9, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', border: `1px solid ${audioEnabled ? 'rgba(183,255,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
              background: audioEnabled ? 'radial-gradient(circle at 30% 28%, #c8ff33, #6aaa00)' : 'rgba(20,20,20,0.85)',
              color: audioEnabled ? '#060606' : '#666',
              boxShadow: audioEnabled ? '0 0 14px rgba(183,255,0,0.4)' : 'none',
              transition: 'all 0.2s', minWidth: 80,
            }}>{audioEnabled ? '● ON' : 'ENABLE'}</button>
          </div>

          {/* Power */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Power</span>
            <button onClick={toggleAudio} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: store.isProcessing
                ? 'radial-gradient(circle at 30% 28%, #c8ff33, #6aaa00)'
                : 'rgba(18,18,18,0.85)',
              border: `2px solid ${store.isProcessing ? 'rgba(183,255,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: store.isProcessing ? '#060606' : '#555',
              fontSize: 15, cursor: 'pointer',
              boxShadow: store.isProcessing ? '0 0 22px rgba(183,255,0,0.55)' : 'inset 0 0 10px rgba(0,0,0,0.9)',
              transition: 'all 0.22s',
            }}>⏻</button>
          </div>
        </div>
      </div>

      {/* ── PRESET BAR ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10, padding: '6px 20px',
        ...glass(0.7, 10),
        borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SectionLabel>Preset</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button onClick={store.previousPreset} style={{ ...btnActive, padding: '4px 8px', fontSize: 12 }}>◀</button>
            <div style={{
              maxWidth: 280, textAlign: 'center', padding: '6px 14px', borderRadius: 5,
              background: 'linear-gradient(90deg, rgba(15,15,15,0.9), rgba(22,22,22,0.9), rgba(15,15,15,0.9))',
              border: '1px solid rgba(183,255,0,0.15)',
              fontSize: 11, color: NEON, fontWeight: 700, letterSpacing: 2,
              boxShadow: `inset 0 0 10px rgba(0,0,0,0.7), 0 0 8px rgba(183,255,0,0.06)`,
              backdropFilter: 'blur(4px)',
            }}>{presetDisplay}</div>
            <button onClick={store.nextPreset} style={{ ...btnActive, padding: '4px 8px', fontSize: 12 }}>▶</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, maxWidth: 200 }}>
          <SectionLabel>Library</SectionLabel>
          <select value={store.presetName} onChange={handlePresetChange}
            style={{ ...glass(0.7, 4), border: '1px solid rgba(255,255,255,0.06)', color: '#888', padding: '4px 10px', borderRadius: 5, fontSize: 10, width: '100%' }}>
            {allPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <SectionLabel>Save</SectionLabel>
          <button onClick={() => store.saveUserPreset(`Custom ${Date.now()}`, 'User')} style={btnActive}>💾</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <SectionLabel>Random</SectionLabel>
          <button onClick={store.randomize} style={btnActive}>⚄</button>
        </div>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '258px 1fr', flex: 1, minHeight: 0, position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL — transparent glass */}
        <div style={{
          padding: 8, display: 'flex', flexDirection: 'column', gap: 5,
          borderRight: '1px solid rgba(255,255,255,0.04)',
          ...glass(0.38, 12),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: NEON, textTransform: 'uppercase', letterSpacing: 2.5, fontWeight: 700, textShadow: `0 0 8px rgba(183,255,0,0.3)` }}>
              Space Visualizer
            </span>
            <span style={{
              fontSize: 8.5, color: '#555', letterSpacing: 2, padding: '1px 6px',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
            }}>{store.spaceMode.toUpperCase()}</span>
          </div>

          {/* Cube */}
          <div style={{
            borderRadius: 8, overflow: 'hidden',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(6px)',
          }}>
            <SpaceCube size={store.parameters.size} decay={store.parameters.decay} height={160} />
          </div>

          {/* Space mode buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
            {SPACE_MODES.map(mode => {
              const active = store.spaceMode === mode;
              return (
                <button key={mode} onClick={() => store.setSpaceMode(mode as SpaceMode)}
                  style={{
                    background: active ? 'rgba(183,255,0,0.08)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${active ? 'rgba(183,255,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    color: active ? NEON : '#555',
                    padding: '4px 0', borderRadius: 3, fontSize: 7, cursor: 'pointer', letterSpacing: 1,
                    boxShadow: active ? '0 0 8px rgba(183,255,0,0.12)' : 'none',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.15s',
                  }}>
                  {mode.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* ASI Smart Mode button */}
          <button onClick={() => {}}
            style={{
              background: asiPulse
                ? 'linear-gradient(90deg, rgba(183,255,0,0.1), rgba(0,255,100,0.06), rgba(183,255,0,0.1))'
                : 'linear-gradient(90deg, rgba(10,10,10,0.7), rgba(20,35,0,0.7))',
              border: `1px solid ${asiPulse ? 'rgba(183,255,0,0.5)' : 'rgba(183,255,0,0.2)'}`,
              color: NEON, padding: '7px 0', borderRadius: 6, fontSize: 9,
              cursor: 'pointer', letterSpacing: 2.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: asiPulse
                ? '0 0 18px rgba(183,255,0,0.18), inset 0 0 12px rgba(183,255,0,0.05)'
                : '0 0 6px rgba(183,255,0,0.06)',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.9s ease',
            }}>
            <span style={{ fontSize: 12, lineHeight: 1, textShadow: `0 0 6px rgba(183,255,0,0.8)` }}>✦</span>
            ASI SMART MODE
          </button>

          {/* Global toggle switches — compact 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { param: 'freeze', icon: '❄', label: 'Freeze' },
              { param: 'ducking', icon: '▽', label: 'Ducking' },
              { param: 'tempoSync', icon: '⌛', label: 'Tempo' },
              { param: 'oversampling', icon: '⊕', label: '2× OS' },
            ].map(({ param, icon, label }) => {
              const active = store.parameters[param as keyof typeof store.parameters] as boolean;
              return (
                <button key={param}
                  onClick={() => handleParamChange(param, !active)}
                  style={{
                    background: active
                      ? 'linear-gradient(180deg, rgba(183,255,0,0.1), rgba(15,35,0,0.7))'
                      : 'rgba(10,10,10,0.55)',
                    border: `1px solid ${active ? 'rgba(183,255,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
                    color: active ? NEON : '#555',
                    padding: '4px 0', borderRadius: 5, fontSize: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: active ? '0 0 10px rgba(183,255,0,0.10)' : 'none',
                    backdropFilter: 'blur(6px)',
                    transition: 'all 0.18s',
                  }}>
                  <span style={{ fontSize: 10, lineHeight: 1 }}>{icon}</span>
                  <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL — light glass */}
        <div style={{
          padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
          ...glass(0.3, 8),
        }}>
          {/* 12 knobs — floating glass card */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
            padding: 10,
            ...glass(0.5, 10),
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {knobRows.map(([param, label]) => (
              <Knob key={param}
                value={store.parameters[param as keyof typeof store.parameters] as number}
                range={PARAMETER_RANGES[param]}
                label={label}
                onChange={(v) => handleParamChange(param, v)}
                size={46}
              />
            ))}
          </div>

          {/* Mix section — glass card */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.6fr', gap: 12,
            padding: 10,
            ...glass(0.5, 10),
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            alignItems: 'flex-end',
            flex: 1,
          }}>
            {[
              { param: 'dry', label: 'DRY', sec: 'Direct' },
              { param: 'er', label: 'ER', sec: 'Early' },
              { param: 'wet', label: 'WET', sec: 'Reverb' },
            ].map(({ param, label, sec }) => (
              <div key={param} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <SectionLabel>{sec}</SectionLabel>
                <Fader
                  value={store.parameters[param as keyof typeof store.parameters] as number}
                  label={label}
                  onChange={(v) => handleParamChange(param, v)}
                />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end' }}>
              <SectionLabel>Imaging</SectionLabel>
              <StereoWidthSlider value={store.parameters.stereoWidth} min={0} max={200}
                onChange={(v) => handleParamChange('stereoWidth', v)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 18px',
        ...glass(0.65, 14),
        borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Meter level={inputLevel} label="Input" />
          <Meter level={outputLevel} label="Output" />
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Stat label="Audio" value={audioStatus} color={audioEnabled ? NEON : '#555'} />
          <Stat label="CPU" value={`${cpuUsage.toFixed(1)}%`} color={NEON} />
          <Stat label="Latency" value="2.1 ms" />
          <Stat label="OS Rate" value={`${store.parameters.oversampling ? '2x' : '1x'}`} />
          <Stat label="Sample Rate" value={`${store.sampleRate / 1000} kHz`} />
          <Stat label="Neural" value={store.isProcessing ? 'ACTIVE' : 'IDLE'} color={store.isProcessing ? NEON : '#444'} />
        </div>
      </div>

      {/* ── FOOTER — category quick-load strip ───────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
        padding: '5px 18px',
        ...glass(0.6, 14),
        borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1,
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            onClick={() => store.loadFirstPresetByCategory(cat.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 8px', borderRadius: 3,
            }}>
            <span style={{ fontSize: 9, color: '#555' }}>{cat.icon}</span>
            <span style={{ fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 1.5, color: '#444' }}>{cat.label}</span>
          </button>
        ))}
        <span style={{ fontSize: 7, color: '#222', letterSpacing: 2, marginLeft: 8 }}>R3 NATIVE LABS</span>
      </div>
    </div>
  );
};
