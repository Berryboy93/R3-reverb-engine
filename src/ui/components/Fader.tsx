import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FaderProps {
  value: number;
  label: string;
  onChange: (value: number) => void;
}

const ACCENT = '#c9a84c';
const TRACK_HEIGHT = 90;
const TRACK_WIDTH = 28;

export function Fader({ value, label, onChange }: FaderProps) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawPct = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(100, rawPct * 100)));
  }, [onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    updateFromPointer(e.clientY);
    e.preventDefault();
  }, [updateFromPointer]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientY);
    const handleUp = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, updateFromPointer]);

  const fillHeight = Math.max(0, (value / 100) * (TRACK_HEIGHT - 4));
  const handlePct = 100 - value;

  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, userSelect: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        style={{
          width: TRACK_WIDTH, height: TRACK_HEIGHT, position: 'relative',
          cursor: 'ns-resize', touchAction: 'none',
          background: '#0a0a0d', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
        }}
        onPointerDown={handlePointerDown}
      >
        <div style={{
          position: 'absolute', left: '50%', top: 6, bottom: 6,
          width: 1, transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: 2, left: 2, right: 2,
          height: fillHeight,
          background: `linear-gradient(0deg, ${ACCENT}, rgba(201,168,76,0.2))`,
          borderRadius: '0 0 4px 4px',
          transition: dragging ? 'none' : 'height 0.08s ease',
        }} />
        <div style={{
          position: 'absolute', left: 1, right: 1, height: 18,
          top: `${handlePct}%`, transform: 'translateY(-50%)',
          borderRadius: 4, pointerEvents: 'none',
          background: hovered ? '#e8e8ea' : '#c0c0c0',
          border: '1px solid rgba(0,0,0,0.3)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          transition: 'background 0.15s',
        }}>
          <div style={{
            position: 'absolute', left: 4, right: 4, top: '50%',
            height: 2, transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.25)', borderRadius: 1,
          }} />
        </div>
      </div>
      <span style={{
        fontSize: 9, color: ACCENT, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{ fontSize: 10, color: '#8a8a8e', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}
