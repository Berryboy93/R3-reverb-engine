import React, { useRef, useEffect } from 'react';

const NEON_GREEN = '#B7FF00';
const WARNING = '#FFD700';
const DANGER = '#FF4444';

interface MeterProps {
  level: number;
  label: string;
}

function dBFromLinear(linear: number): number {
  if (linear <= 0) return -60;
  return 20 * Math.log10(linear);
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

    const segs = 24;
    const gap = 2;
    const segW = (w - gap * (segs - 1)) / segs;

    const db = dBFromLinear(level);
    const dbMin = -60;
    const dbMax = 6;
    const pct = Math.max(0, Math.min(1, (db - dbMin) / (dbMax - dbMin)));
    const active = Math.floor(segs * pct);

    for (let i = 0; i < segs; i++) {
      const x = i * (segW + gap);
      const ratio = i / segs;
      let color = '#1a1a1a';
      if (i < active) {
        if (ratio < 0.7) color = NEON_GREEN;
        else if (ratio < 0.85) color = WARNING;
        else color = DANGER;
      }
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = i < active ? 4 : 0;
      ctx.fillRect(x, 2, segW, h - 4);
      ctx.shadowBlur = 0;
    }

    // dB text
    ctx.fillStyle = '#888';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(db > -60 ? `${db.toFixed(1)}dB` : '-∞', w, h + 10);
  }, [level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 100 }}>
      <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <canvas ref={canvasRef} width={120} height={14} style={{ background: '#0a0a0a', borderRadius: 3, border: '1px solid #222' }} />
    </div>
  );
};
