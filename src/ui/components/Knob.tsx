import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ParameterRange } from '../../types/reverb';

// ─── Design tokens ──────────────────────────────────────────────────────────
// Colour constants — changing these intentionally requires a snapshot update.
const NEON = '#B7FF00';
const CHROME_HI = '#f0f0f0';

// Geometry ratios (all relative to the outer ring radius R).
// Named so that a snapshot diff names the constant that moved rather than
// showing an unexplained floating-point change.
/** Body / LED-arc radius as a fraction of R. */
const BODY_R_RATIO = 0.78;
/** Distance from centre to the far end of the indicator line (fraction of R). */
const INDICATOR_OUTER_RATIO = 0.48;
/** Distance from centre to the near end of the indicator line (fraction of R). */
const INDICATOR_INNER_RATIO = 0.20;
/** Centre-gem radius as a fraction of R. */
const GEM_R_RATIO = 0.14;

// Shadow-blur levels for interactive states.
/** LED arc glow blur when the knob is idle. */
const LED_BLUR_IDLE = 8;
/** LED arc glow blur when the knob is hovered. */
const LED_BLUR_HOVER = 14;
/** Gem glow blur when the knob is idle. */
const GEM_BLUR_IDLE = 5;
/** Gem glow blur when the knob is hovered. */
const GEM_BLUR_HOVER = 10;


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
  const startYRef = useRef(0);
  const startValRef = useRef(0);

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

    // ─── Deep shadow well ───────────────────────────────────────────
    const shadow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R + 3);
    shadow.addColorStop(0, 'rgba(0,0,0,0)');
    shadow.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.beginPath();
    ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
    ctx.fillStyle = shadow;
    ctx.fill();

    // ─── Outer chamfer ring (brushed anisotropic) ──────────────────
    for (let i = 0; i < 360; i += 3) {
      const a = (i * Math.PI) / 180;
      const brightness = 0.2 + 0.5 * Math.abs(Math.sin(a * 2));
      const c = Math.round(brightness * 180);
      ctx.beginPath();
      ctx.arc(cx, cy, R, a, a + (3.2 * Math.PI) / 180);
      ctx.strokeStyle = `rgb(${c},${c},${c})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // ─── LED track (dark groove) ───────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1.5, startAng, startAng + sweepAng);
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // ─── LED arc glow corona ──────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1.5, startAng, endAng);
    ctx.strokeStyle = 'rgba(183,255,0,0.12)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.stroke();

    // ─── LED arc fill ──────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1.5, startAng, endAng);
    ctx.strokeStyle = NEON;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.shadowColor = NEON;
    ctx.shadowBlur = hovered ? LED_BLUR_HOVER : LED_BLUR_IDLE;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ─── Main body — deep chrome radial ───────────────────────────
    const bodyGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R * BODY_R_RATIO);
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

    // ─── Brushed metal top ring (anisotropic horizontal bands) ────
    const bx0 = cx - R * BODY_R_RATIO, bx1 = cx + R * BODY_R_RATIO;
    const by0 = cy - R * BODY_R_RATIO, by1 = cy + R * BODY_R_RATIO;
    const brushGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
    brushGrad.addColorStop(0.00, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.15, 'rgba(255,255,255,0.08)');
    brushGrad.addColorStop(0.30, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    brushGrad.addColorStop(0.60, 'rgba(255,255,255,0.00)');
    brushGrad.addColorStop(0.75, 'rgba(255,255,255,0.05)');
    brushGrad.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = brushGrad;
    ctx.fill();

    // ─── Inner specular highlight (top-left catch-light) ─────────
    const specGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.32, 0, cx - R * 0.1, cy - R * 0.1, R * 0.55);
    specGrad.addColorStop(0.00, 'rgba(255,255,255,0.55)');
    specGrad.addColorStop(0.30, 'rgba(255,255,255,0.08)');
    specGrad.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();

    // ─── Inner rim bevel ─────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R * BODY_R_RATIO, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(cx - R * BODY_R_RATIO, cy - R * BODY_R_RATIO, cx + R * BODY_R_RATIO, cy + R * BODY_R_RATIO);
    rimGrad.addColorStop(0, 'rgba(200,200,200,0.4)');
    rimGrad.addColorStop(0.5, 'rgba(0,0,0,0.0)');
    rimGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── Indicator line ───────────────────────────────────────────
    const ix = cx + Math.cos(endAng) * R * INDICATOR_OUTER_RATIO;
    const iy = cy + Math.sin(endAng) * R * INDICATOR_OUTER_RATIO;
    const ix2 = cx + Math.cos(endAng) * R * INDICATOR_INNER_RATIO;
    const iy2 = cy + Math.sin(endAng) * R * INDICATOR_INNER_RATIO;
    ctx.beginPath();
    ctx.moveTo(ix2, iy2);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = CHROME_HI;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ─── Indicator tip dot ────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
    const dotG = ctx.createRadialGradient(ix - 0.8, iy - 0.8, 0, ix, iy, 2.5);
    dotG.addColorStop(0, '#fff');
    dotG.addColorStop(1, NEON);
    ctx.fillStyle = dotG;
    ctx.shadowColor = NEON;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ─── Center gem ───────────────────────────────────────────────
    const gemR = R * GEM_R_RATIO;
    const gemGrad = ctx.createRadialGradient(cx - gemR * 0.4, cy - gemR * 0.4, 0, cx, cy, gemR);
    gemGrad.addColorStop(0, 'rgba(183,255,0,0.9)');
    gemGrad.addColorStop(0.5, 'rgba(120,200,0,0.4)');
    gemGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.beginPath();
    ctx.arc(cx, cy, gemR, 0, Math.PI * 2);
    ctx.fillStyle = gemGrad;
    ctx.shadowColor = NEON;
    ctx.shadowBlur = hovered ? GEM_BLUR_HOVER : GEM_BLUR_IDLE;
    ctx.fill();
    ctx.shadowBlur = 0;
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
      const delta = (startYRef.current - e.clientY) * (range.max - range.min) / 220;
      let v = Math.max(range.min, Math.min(range.max, startValRef.current + delta));
      v = Math.round(v / range.step) * range.step;
      onChange(v);
    };
    const handleUp = () => setDragging(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: dragging ? 'grabbing' : 'grab', display: 'block' }}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <span style={{
        fontSize: 9, color: '#777', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700,
        textShadow: '0 1px 0 #000',
      }}>{label}</span>
      <span style={{
        fontSize: 10, color: NEON, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 8px rgba(183,255,0,0.5)`,
        letterSpacing: 0.5,
      }}>{display}<span style={{ fontSize: 8, color: 'rgba(183,255,0,0.6)', marginLeft: 2 }}>{range.unit}</span></span>
    </div>
  );
};
