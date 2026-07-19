import React, { useState, useRef, useEffect } from 'react';

const NEON_GREEN = '#B7FF00';

interface StereoWidthSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export const StereoWidthSlider: React.FC<StereoWidthSliderProps> = ({ value, min, max, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = (value - min) / (max - min);

  const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    const newVal = Math.max(min, Math.min(max, min + p * (max - min)));
    onChange(Math.round(newVal));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateFromMouse(e);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => { if (dragging) updateFromMouse(e); };
    const handleUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#666', textTransform: 'uppercase' }}>
        <span>Mono</span>
        <span>Ultra Wide</span>
      </div>
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{
          height: 22, width: '100%', borderRadius: 11, cursor: 'ew-resize',
          background: 'linear-gradient(90deg, #0a0a0a, #151515, #0a0a0a)',
          border: '1px solid #222', position: 'relative',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8)',
        }}
      >
        {/* Green fill */}
        <div style={{
          position: 'absolute', left: 3, top: 3, bottom: 3,
          width: `calc(${pct * 100}% - 6px)`, borderRadius: 8,
          background: `linear-gradient(90deg, rgba(183,255,0,0.15), ${NEON_GREEN})`,
          boxShadow: `0 0 10px ${NEON_GREEN}44`,
        }} />
        {/* Metallic handle */}
        <div style={{
          position: 'absolute', left: `calc(${pct * 100}% - 12px)`, top: 1,
          width: 24, height: 18, borderRadius: 9,
          background: 'linear-gradient(180deg, #f0f0f0, #888, #444)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 8px rgba(183,255,0,0.3)',
          border: '1px solid #333',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' }}>
        <span style={{ color: NEON_GREEN, fontWeight: 700 }}>{value}%</span>
        <span style={{ fontSize: 9, color: '#555' }}>STEREO WIDTH</span>
      </div>
    </div>
  );
};
