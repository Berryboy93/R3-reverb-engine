import React, { useState, useRef, useEffect, useCallback } from 'react';

interface StereoWidthSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const ACCENT = '#c9a84c';

export function StereoWidthSlider({ value, min, max, onChange }: StereoWidthSliderProps) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = (value - min) / (max - min);

  const updateFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = (clientX - rect.left) / rect.width;
    const newVal = Math.max(min, Math.min(max, min + p * (max - min)));
    onChange(Math.round(newVal));
  }, [min, max, onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    updateFromPointer(e.clientX);
    e.preventDefault();
  }, [updateFromPointer]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientX);
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

  return (
    <div
      role="slider"
      aria-label="Stereo Width"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, userSelect: 'none' }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <span>Mono</span>
        <span>Wide</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        style={{
          height: 20, width: '100%', borderRadius: 10,
          cursor: 'ew-resize', touchAction: 'none',
          background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', left: 2, top: 2, bottom: 2,
          width: `calc(${pct * 100}% - 4px)`, borderRadius: 8,
          background: `linear-gradient(90deg, rgba(201,168,76,0.2), ${ACCENT})`,
          transition: dragging ? 'none' : 'width 0.15s ease',
        }} />
        <div style={{
          position: 'absolute', left: `${pct * 100}%`, top: 2,
          width: 20, height: 14, borderRadius: 7,
          background: '#e8e8ea', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          transform: 'translateX(-50%)',
          transition: dragging ? 'none' : 'left 0.15s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {value}%
        </span>
        <span style={{ fontSize: 9, color: '#5a5a5e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Stereo Width
        </span>
      </div>
    </div>
  );
}
