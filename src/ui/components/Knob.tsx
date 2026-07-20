/**
 * @component Knob
 * @origin Replit
 * @integrated 2026-07-20
 * @integrated-by r3v
 * @tier All
 * @audit-status Phase10
 * @deferred-findings none
 *
 * Production-grade rotary knob:
 * - Tick marks every 5° (major at 15°) with lit/unlit states
 * - HDR multi-layer LED bloom (diffuse → corona → bright core)
 * - CNC-machined radial brushing strokes on body
 * - Glass lens reflection catch-light
 * - Spring-damped inertia coasting after drag release
 * - Bebas Neue label / Montserrat value (R3 Native brand standard)
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ParameterRange } from '../../types/reverb';

// ─── Design tokens ──────────────────────────────────────────────────────────
const NEON = '#B7FF00';
const CHROME_HI = '#f0f0f0';

// ─── Geometry ratios (relative to outer ring radius R) ──────────────────────
const BODY_R_RATIO = 0.78;
const INDICATOR_OUTER_RATIO = 0.48;
const INDICATOR_INNER_RATIO = 0.20;
const GEM_R_RATIO = 0.14;

// ─── Tick geometry ───────────────────────────────────────────────────────────
/** Total sweep of the arc in degrees. */
const TICK_SWEEP_DEG = 270;
/** One tick every 5°. */
const TICK_STEP_DEG = 5;
/** Number of tick intervals (= number of spaces between marks). */
const TICK_COUNT = TICK_SWEEP_DEG / TICK_STEP_DEG; // 54

// ─── Glow blur levels ────────────────────────────────────────────────────────
const LED_BLUR_IDLE = 9;
const LED_BLUR_HOVER = 18;
const GEM_BLUR_IDLE = 6;
const GEM_BLUR_HOVER = 14;

// ─── Spring-damping constants ─────────────────────────────────────────────────
/** Friction applied to velocity each frame (0 = instant stop, 1 = no friction). */
const COAST_DAMPING = 0.84;
/** Stop coasting when velocity drops below this fraction of one step. */
const COAST_MIN_VEL_RATIO = 0.008;

interface KnobProps {
  value: number;
  range: ParameterRange;
  label: string;
  onChange: (value: number) => void;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ value, range, label, onChange, size = 52 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Drag tracking
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  // Velocity / inertia
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0); // value-units / frame
  const coastValRef = useRef(value);
  const coastAnimRef = useRef<number>(0);

  // Live value mirror for the coast closure
  const liveValueRef = useRef(value);
  liveValueRef.current = value;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 3;
    const pct = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const startAng = Math.PI * 0.75;
    const sweepAng = Math.PI * 1.5;
    const endAng = startAng + pct * sweepAng;

    ctx.clearRect(0, 0, size, size);

    // ─── Deep shadow well ─────────────────────────────────────────────────
    const shadow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R + 3);
    shadow.addColorStop(0, 'rgba(0,0,0,0)');
    shadow.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.beginPath();
    ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
    ctx.fillStyle = shadow;
    ctx.fill();

    // ─── Tick marks every 5° ─────────────────────────────────────────────
    for (let i = 0; i <= TICK_COUNT; i++) {
      const angle = startAng + (i / TICK_COUNT) * sweepAng;
      const isMajor = i % 3 === 0; // every 15°
      const outerR = R - 0.5;
      const innerR = R - (isMajor ? 6 : 3.5);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const isLit = i / TICK_COUNT <= pct;

      ctx.beginPath();
      ctx.moveTo(cx + cos * outerR, cy + sin * outerR);
      ctx.lineTo(cx + cos * innerR, cy + sin * innerR);
      ctx.lineWidth = isMajor ? 1.5 : 0.75;
      ctx.lineCap = 'round';

      if (isLit && isMajor) {
        ctx.strokeStyle = 'rgba(183,255,0,0.9)';
        ctx.shadowColor = NEON;
        ctx.shadowBlur = 5;
      } else if (isLit) {
        ctx.strokeStyle = 'rgba(183,255,0,0.4)';
        ctx.shadowBlur = 0;
      } else if (isMajor) {
        ctx.strokeStyle = 'rgba(100,100,100,0.4)';
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'rgba(55,55,55,0.25)';
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ─── LED track groove ─────────────────────────────────────────────────
    const ledR = R - 8;
    ctx.beginPath();
    ctx.arc(cx, cy, ledR, startAng, startAng + sweepAng);
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // ─── HDR bloom — outer diffuse halo ───────────────────────────────────
    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, ledR, startAng, endAng);
      ctx.strokeStyle = 'rgba(183,255,0,0.07)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.stroke();

      // ─── HDR bloom — mid corona ────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, ledR, startAng, endAng);
      ctx.strokeStyle = `rgba(183,255,0,${hovered ? 0.22 : 0.13})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      // ─── HDR bloom — bright core ───────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, ledR, startAng, endAng);
      ctx.strokeStyle = NEON;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = NEON;
      ctx.shadowBlur = hovered ? LED_BLUR_HOVER : LED_BLUR_IDLE;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ─── Outer chamfer ring (anisotropic brushed) ─────────────────────────
    const chamferR = R * BODY_R_RATIO + 1.5;
    for (let i = 0; i < 360; i += 3) {
      const a = (i * Math.PI) / 180;
      const brightness = 0.18 + 0.52 * Math.abs(Math.sin(a * 2));
      const c = Math.round(brightness * 185);
      ctx.beginPath();
      ctx.arc(cx, cy, chamferR, a, a + (3.2 * Math.PI) / 180);
      ctx.strokeStyle = `rgb(${c},${c},${c})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // ─── Main body — deep chrome radial ───────────────────────────────────
    const bodyGrad = ctx.createRadialGradient(
      cx - R * 0.3, cy - R * 0.3, R * 0.05,
      cx, cy, R * BODY_R_RATIO
    );
    bodyGrad.addColorStop(0.00, '#d4d4d4');
    bodyGrad.addColorStop(0.08, '#888');
    bodyGrad.addColorStop(0.25, '#3c3c3c');
    bodyGrad.addColorStop(0.55, '#1c1c1c');
    bodyGrad.addColorStop(0.85, '#111');
    bodyGrad.addColorStop(1.00, '#080808');
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // ─── CNC radial brushing strokes ──────────────────────────────────────
    const numStrokes = 48;
    for (let i = 0; i < numStrokes; i++) {
      const angle = (i / numStrokes) * Math.PI * 2;
      const innerBrush = R * BODY_R_RATIO * 0.3;
      const outerBrush = R * BODY_R_RATIO * 0.92;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const baseAlpha = 0.022 + 0.018 * Math.abs(Math.cos(angle * 3));
      const sg = ctx.createLinearGradient(
        cx + cos * innerBrush, cy + sin * innerBrush,
        cx + cos * outerBrush, cy + sin * outerBrush
      );
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.45, `rgba(255,255,255,${baseAlpha})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(cx + cos * innerBrush, cy + sin * innerBrush);
      ctx.lineTo(cx + cos * outerBrush, cy + sin * outerBrush);
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ─── Linear brushed overlay ────────────────────────────────────────────
    const bx0 = cx - R * BODY_R_RATIO;
    const bx1 = cx + R * BODY_R_RATIO;
    const by0 = cy - R * BODY_R_RATIO;
    const by1 = cy + R * BODY_R_RATIO;
    const brushGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
    brushGrad.addColorStop(0.00, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.15, 'rgba(255,255,255,0.07)');
    brushGrad.addColorStop(0.30, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.45, 'rgba(255,255,255,0.05)');
    brushGrad.addColorStop(0.60, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.75, 'rgba(255,255,255,0.04)');
    brushGrad.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = brushGrad;
    ctx.fill();

    // ─── Top-left specular catch-light ────────────────────────────────────
    const specGrad = ctx.createRadialGradient(
      cx - R * 0.3, cy - R * 0.32, 0,
      cx - R * 0.1, cy - R * 0.1, R * 0.55
    );
    specGrad.addColorStop(0.00, 'rgba(255,255,255,0.65)');
    specGrad.addColorStop(0.20, 'rgba(255,255,255,0.10)');
    specGrad.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();

    // ─── Glass lens reflection (curved highlight strip) ───────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.clip();
    const glassGrad = ctx.createLinearGradient(
      cx - R * BODY_R_RATIO, cy - R * BODY_R_RATIO * 0.7,
      cx + R * BODY_R_RATIO * 0.3, cy - R * BODY_R_RATIO * 0.1
    );
    glassGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
    glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    glassGrad.addColorStop(1, 'rgba(255,255,255,0.00)');
    ctx.beginPath();
    ctx.ellipse(
      cx - R * 0.1, cy - R * BODY_R_RATIO * 0.4,
      R * BODY_R_RATIO * 0.62, R * BODY_R_RATIO * 0.16,
      -0.25, 0, Math.PI * 2
    );
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.restore();

    // ─── Inner rim bevel ──────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(
      cx - R * BODY_R_RATIO, cy - R * BODY_R_RATIO,
      cx + R * BODY_R_RATIO, cy + R * BODY_R_RATIO
    );
    rimGrad.addColorStop(0, 'rgba(200,200,200,0.4)');
    rimGrad.addColorStop(0.5, 'rgba(0,0,0,0.0)');
    rimGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── Indicator line ───────────────────────────────────────────────────
    const ix = cx + Math.cos(endAng) * R * INDICATOR_OUTER_RATIO;
    const iy = cy + Math.sin(endAng) * R * INDICATOR_OUTER_RATIO;
    const ix2 = cx + Math.cos(endAng) * R * INDICATOR_INNER_RATIO;
    const iy2 = cy + Math.sin(endAng) * R * INDICATOR_INNER_RATIO;
    ctx.beginPath();
    ctx.moveTo(ix2, iy2);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = CHROME_HI;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ─── Indicator tip dot ────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(ix, iy, 2.8, 0, Math.PI * 2);
    const dotG = ctx.createRadialGradient(ix - 0.8, iy - 0.8, 0, ix, iy, 2.8);
    dotG.addColorStop(0, '#ffffff');
    dotG.addColorStop(0.6, NEON);
    dotG.addColorStop(1, 'rgba(100,180,0,0.5)');
    ctx.fillStyle = dotG;
    ctx.shadowColor = NEON;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ─── Center gem ───────────────────────────────────────────────────────
    const gemR = R * GEM_R_RATIO;
    const gemGrad = ctx.createRadialGradient(
      cx - gemR * 0.4, cy - gemR * 0.4, 0,
      cx, cy, gemR
    );
    gemGrad.addColorStop(0.00, 'rgba(225,255,110,0.96)');
    gemGrad.addColorStop(0.40, 'rgba(183,255,0,0.65)');
    gemGrad.addColorStop(0.80, 'rgba(100,180,0,0.30)');
    gemGrad.addColorStop(1.00, 'rgba(0,0,0,0.80)');
    ctx.beginPath();
    ctx.arc(cx, cy, gemR, 0, Math.PI * 2);
    ctx.fillStyle = gemGrad;
    ctx.shadowColor = NEON;
    ctx.shadowBlur = hovered ? GEM_BLUR_HOVER : GEM_BLUR_IDLE;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ─── Gem inner specular dot ────────────────────────────────────────────
    const gemSpec = ctx.createRadialGradient(
      cx - gemR * 0.32, cy - gemR * 0.38, 0,
      cx - gemR * 0.15, cy - gemR * 0.2, gemR * 0.55
    );
    gemSpec.addColorStop(0, 'rgba(255,255,255,0.92)');
    gemSpec.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    gemSpec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, gemR, 0, Math.PI * 2);
    ctx.fillStyle = gemSpec;
    ctx.fill();
  }, [value, range, size, hovered]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cancelAnimationFrame(coastAnimRef.current);
    setDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging) return;

      // Track velocity (value-units per 16ms frame)
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        const dyPx = lastYRef.current - e.clientY;
        velocityRef.current = (dyPx / dt) * 16 * (range.max - range.min) / 220;
      }
      lastYRef.current = e.clientY;
      lastTimeRef.current = now;

      const delta = (startYRef.current - e.clientY) * (range.max - range.min) / 220;
      let v = Math.max(range.min, Math.min(range.max, startValRef.current + delta));
      v = Math.round(v / range.step) * range.step;
      onChange(v);
    };

    const handleUp = () => {
      setDragging(false);
      // Spring-damped coast
      let vel = velocityRef.current;
      coastValRef.current = liveValueRef.current;
      const minVel = range.step * COAST_MIN_VEL_RATIO;

      const coast = () => {
        vel *= COAST_DAMPING;
        if (Math.abs(vel) < minVel) return;
        coastValRef.current = Math.max(range.min, Math.min(range.max, coastValRef.current + vel));
        const snapped = Math.round(coastValRef.current / range.step) * range.step;
        onChange(snapped);
        coastAnimRef.current = requestAnimationFrame(coast);
      };
      coastAnimRef.current = requestAnimationFrame(coast);
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

  // Cancel coast on unmount
  useEffect(() => () => { cancelAnimationFrame(coastAnimRef.current); }, []);

  const display = range.displayFormat(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        data-testid="knob-canvas"
        aria-label={`${label} knob`}
        style={{
          width: size, height: size,
          cursor: dragging ? 'grabbing' : 'grab',
          display: 'block', touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <span style={{
        fontFamily: "'Bebas Neue', 'Montserrat', sans-serif",
        fontSize: 9.5, color: '#777', textTransform: 'uppercase', letterSpacing: 2.2, fontWeight: 400,
        textShadow: '0 1px 0 #000',
      }}>{label}</span>
      <span style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 10, color: NEON, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 8px rgba(183,255,0,0.5)`,
        letterSpacing: 0.5,
      }}>
        {display}
        <span style={{ fontSize: 7.5, color: 'rgba(183,255,0,0.55)', marginLeft: 2 }}>{range.unit}</span>
      </span>
    </div>
  );
};
