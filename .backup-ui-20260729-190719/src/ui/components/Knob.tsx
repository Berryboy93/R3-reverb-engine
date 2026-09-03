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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 4;
    const pct = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const endAngle = START_ANGLE + pct * SWEEP_ANGLE;

    ctx.clearRect(0, 0, size, size);

    // Tick marks
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

    // Arc track background
    const arcR = R - 7;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, START_ANGLE, START_ANGLE + SWEEP_ANGLE);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Active arc
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

    // Body
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

    // Body rim
    ctx.beginPath();
    ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Indicator
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

    // Indicator dot
    ctx.beginPath();
    ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center cap
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none' }}>
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
