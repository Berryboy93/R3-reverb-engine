import React, { useRef, useEffect } from 'react';

const NEON_GREEN = '#B7FF00';
const WARNING = '#FFD700';
const DANGER = '#FF4444';

interface MeterProps {
  level: number;
  label: string;
}

export const Meter: React.FC<MeterProps> = ({ level, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const segW = 4;
    const gap = 2;
    const segs = Math.floor(w / (segW + gap));

    for (let i = 0; i < segs; i++) {
      const x = i * (segW + gap);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, 0, segW, h);
    }

    const active = Math.floor(segs * Math.max(0, Math.min(1, level)));
    for (let i = 0; i < active; i++) {
      const x = i * (segW + gap);
      const hue = i < segs * 0.7 ? NEON_GREEN : i < segs * 0.85 ? WARNING : DANGER;
      ctx.fillStyle = hue;
      ctx.shadowColor = hue;
      ctx.shadowBlur = 4;
      ctx.fillRect(x, 0, segW, h);
      ctx.shadowBlur = 0;
    }
  }, [level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <canvas ref={canvasRef} width={80} height={16} style={{ background: '#111', borderRadius: 4 }} />
    </div>
  );
};
