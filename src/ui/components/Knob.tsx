import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ParameterRange } from '../../types/reverb';

const NEON_GREEN = '#B7FF00';
const GRAPHITE = '#242424';
const DARK_GRAPHITE = '#1a1a1a';
const TITANIUM = '#E6E6E6';
const TEXT_SECONDARY = '#888888';

interface KnobProps {
  value: number;
  range: ParameterRange;
  label: string;
  onChange: (value: number) => void;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ value, range, label, onChange, size = 72 }) => {
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
    const h = size * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = DARK_GRAPHITE;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    const pct = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const endAngle = Math.PI * 0.75 + pct * Math.PI * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, endAngle);
    ctx.strokeStyle = NEON_GREEN;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = NEON_GREEN;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const ix = cx + Math.cos(endAngle) * (r - 3);
    const iy = cy + Math.sin(endAngle) * (r - 3);
    ctx.beginPath();
    ctx.arc(ix, iy, 3, 0, Math.PI * 2);
    ctx.fillStyle = TITANIUM;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = GRAPHITE;
    ctx.lineWidth = 1;
    ctx.stroke();
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
        />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 11, color: NEON_GREEN, fontWeight: 700,
          pointerEvents: 'none', fontVariantNumeric: 'tabular-nums',
        }}>
          {display}
        </div>
      </div>
      <span style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: '#444' }}>
        {range.min}-{range.max} {range.unit}
      </span>
    </div>
  );
};
