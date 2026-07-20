import React, { useState, useRef, useEffect } from 'react';

const NEON_GREEN = '#B7FF00';

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

  const segments = [0, 20, 40, 60, 80, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, userSelect: 'none' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch', height: 70 }}>
        {/* Left LED segment strip */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
          {segments.map((seg, i) => {
            const active = value >= seg;
            return (
              <div key={i} style={{
                width: 4, height: 8, borderRadius: 1,
                background: active ? NEON_GREEN : '#1a1a1a',
                boxShadow: active ? `0 0 4px ${NEON_GREEN}` : 'none',
                transition: 'all 0.05s',
              }} />
            );
          })}
        </div>

        <div
          ref={trackRef}
          style={{
            width: 24, height: 70,
            background: 'linear-gradient(90deg, #0a0a0a, #151515, #0a0a0a)',
            borderRadius: 8, position: 'relative', overflow: 'hidden',
            border: '1px solid #222', cursor: 'ns-resize',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Metallic track edges */}
          <div style={{ position: 'absolute', left: 2, right: 2, top: 4, bottom: 4, borderRadius: 6, border: '1px solid #333' }} />
          
          {/* Green LED fill */}
          <div style={{
            position: 'absolute', bottom: 4, left: 4, right: 4,
            height: `calc(${(value / 100) * 100}% - 4px)`,
            minHeight: 0,
            background: `linear-gradient(0deg, ${NEON_GREEN} 0%, rgba(183,255,0,0.25) 100%)`,
            borderRadius: '0 0 5px 5px',
            boxShadow: `0 0 12px ${NEON_GREEN}44`,
            transition: 'height 0.05s',
          }} />

          {/* Silver handle with shadow */}
          <div style={{
            position: 'absolute', left: 2, right: 2, height: 12,
            background: 'linear-gradient(180deg, #f0f0f0, #aaa, #666, #444)',
            borderRadius: 3,
            boxShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 8px rgba(183,255,0,0.3)',
            top: `${100 - value}%`, transform: 'translateY(-50%)',
            pointerEvents: 'none',
            border: '1px solid #333',
          }} />
        </div>
      </div>

      <span style={{ fontSize: 10, color: NEON_GREEN, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}%</span>
    </div>
  );
};
