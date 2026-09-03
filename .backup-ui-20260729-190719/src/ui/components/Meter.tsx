import { useRef, useEffect } from 'react';

interface MeterProps {
  level: number;
  label: string;
}

const SEGMENTS = 24;
const GAP = 1;
const DB_MIN = -60;
const DB_MAX = 6;
const HOLD_TIME_MS = 1500;
const CANVAS_W = 120;
const CANVAS_H = 30;

function dBFromLinear(linear: number): number {
  if (linear <= 0.000001) return -Infinity;
  return 20 * Math.log10(linear);
}

function segmentColor(ratio: number): string {
  if (ratio < 0.65) return '#4ac98a';
  if (ratio < 0.80) return '#c9a84c';
  if (ratio < 0.90) return '#d4a03a';
  return '#c94a4a';
}

export function Meter({ level, label }: MeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakRef = useRef(-Infinity);
  const peakTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    const w = CANVAS_W;
    const barH = CANVAS_H - 16;
    const segW = (w - GAP * (SEGMENTS - 1)) / SEGMENTS;

    const db = dBFromLinear(level);
    const pct = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)));
    const activeCount = Math.floor(SEGMENTS * pct);

    const now = performance.now();
    if (db > peakRef.current) {
      peakRef.current = db;
      peakTimeRef.current = now;
    } else if (now - peakTimeRef.current > HOLD_TIME_MS) {
      peakRef.current = db;
    }
    const peakPct = Math.max(0, Math.min(1, (peakRef.current - DB_MIN) / (DB_MAX - DB_MIN)));
    const peakIndex = Math.floor(SEGMENTS * peakPct);

    ctx.clearRect(0, 0, w, CANVAS_H);

    for (let i = 0; i < SEGMENTS; i++) {
      const x = i * (segW + GAP);
      ctx.fillStyle = '#1a1a1f';
      ctx.fillRect(x, 0, segW, barH);
    }

    for (let i = 0; i < SEGMENTS; i++) {
      const x = i * (segW + GAP);
      const ratio = i / SEGMENTS;
      if (i < activeCount) {
        ctx.fillStyle = segmentColor(ratio);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 3;
        ctx.fillRect(x, 0, segW, barH);
        ctx.shadowBlur = 0;
      }
    }

    if (peakIndex >= 0 && peakIndex < SEGMENTS) {
      const x = peakIndex * (segW + GAP);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 0, segW, barH);
    }

    ctx.fillStyle = '#8a8a8e';
    ctx.font = '10px var(--r3-font-mono)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const dbText = db > DB_MIN ? `${db.toFixed(1)} dB` : '-∞ dB';
    ctx.fillText(dbText, w, barH + 3);
  }, [level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
      <span style={{
        fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase',
        letterSpacing: '0.1em', fontWeight: 500,
      }}>{label}</span>
      <canvas
        ref={canvasRef}
        style={{
          width: CANVAS_W, height: CANVAS_H, borderRadius: 3,
          background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
    </div>
  );
}
