import React, { useState, useRef, useEffect } from 'react';

const NEON_GREEN = '#B7FF00';
const TITANIUM = '#E6E6E6';

interface FaderProps {
  value: number;
  label: string;
  onChange: (value: number) => void;
}

export const Fader: React.FC<FaderProps> = ({ value, label, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateFromMouse(e);
  };

  const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = 1 - (e.clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(100, pct * 100)));
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        ref={trackRef}
        style={{
          width: 32, height: 100, background: '#111',
          borderRadius: 6, position: 'relative', overflow: 'hidden',
          border: '1px solid #222', cursor: 'ns-resize',
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${value}%`,
          background: `linear-gradient(0deg, ${NEON_GREEN} 0%, rgba(183,255,0,0.3) 100%)`,
          borderRadius: '0 0 6px 6px',
          transition: 'height 0.05s',
        }} />
        <div style={{
          position: 'absolute', left: -4, right: -4, height: 8,
          background: TITANIUM, borderRadius: 4,
          boxShadow: `0 0 8px ${NEON_GREEN}66`,
          top: `${100 - value}%`, transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />
      </div>
      <span style={{ fontSize: 10, color: NEON_GREEN, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#888' }}>{Math.round(value)}%</span>
    </div>
  );
};
