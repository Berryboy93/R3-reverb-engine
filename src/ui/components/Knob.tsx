import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ParameterRange } from '../../types/reverb';

const NEON_GREEN = '#B7FF00';

interface KnobProps {
  value: number;
  range: ParameterRange;
  label: string;
  onChange: (value: number) => void;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ value, range, label, onChange, size = 64 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = size * dpr;
    canvas.width = w;
    canvas.height = w;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    // Outer shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Chamfered metallic body gradient
    const bodyGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
    bodyGrad.addColorStop(0, '#666');
    bodyGrad.addColorStop(0.15, '#444');
    bodyGrad.addColorStop(0.4, '#2a2a2a');
    bodyGrad.addColorStop(0.85, '#1a1a1a');
    bodyGrad.addColorStop(1, '#0d0d0d');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Brushed-metal highlight ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    ringGrad.addColorStop(0, '#888');
    ringGrad.addColorStop(0.25, '#111');
    ringGrad.addColorStop(0.5, '#aaa');
    ringGrad.addColorStop(0.75, '#111');
    ringGrad.addColorStop(1, '#888');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top cap metallic gradient
    const capGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r * 0.82);
    capGrad.addColorStop(0, '#e6e6e6');
    capGrad.addColorStop(0.2, '#999');
    capGrad.addColorStop(0.5, '#555');
    capGrad.addColorStop(0.85, '#333');
    capGrad.addColorStop(1, '#1a1a1a');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = capGrad;
    ctx.fill();

    // Value arc (green LED ring)
    const pct = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const startAngle = Math.PI * 0.75;
    const endAngle = startAngle + pct * Math.PI * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, startAngle, endAngle);
    ctx.strokeStyle = NEON_GREEN;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = NEON_GREEN;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Indicator dot on cap
    const ix = cx + Math.cos(endAngle) * (r * 0.55);
    const iy = cy + Math.sin(endAngle) * (r * 0.55);
    ctx.beginPath();
    ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
    const dotGrad = ctx.createRadialGradient(ix - 1, iy - 1, 0, ix, iy, 3.5);
    dotGrad.addColorStop(0, '#fff');
    dotGrad.addColorStop(1, '#555');
    ctx.fillStyle = dotGrad;
    ctx.fill();
  }, [value, range, size]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;
      const delta = (startYRef.current - e.clientY) * (range.max - range.min) / 200;
      let newVal = Math.max(range.min, Math.min(range.max, startValRef.current + delta));
      newVal = Math.round(newVal / range.step) * range.step;
      onChange(newVal);
    };
    const handleUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, range, onChange]);

  const display = range.displayFormat(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
        />
      </div>
      <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
        {label}
      </span>
      <span style={{
        fontSize: 11, color: NEON_GREEN, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        textShadow: '0 0 6px rgba(183,255,0,0.4)',
      }}>
        {display} {range.unit}
      </span>
    </div>
  );
};
