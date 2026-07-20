import React, { useState, useRef, useEffect } from 'react';

const NEON = '#B7FF00';

interface FaderProps {
  value: number;
  label: string;
  onChange: (value: number) => void;
}

export const Fader: React.FC<FaderProps> = ({ value, label, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = 1 - (e.clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(100, pct * 100)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateFromMouse(e);
    e.preventDefault();
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

  // 12 LED segments
  const SEGS = 12;
  const activeSegs = Math.round((value / 100) * SEGS);
  const segColor = (i: number) => {
    if (i >= SEGS - activeSegs) {
      if (i >= SEGS - 2) return '#ff4444';        // clip zone
      if (i >= SEGS - 4) return '#ffaa00';        // hot zone
      return NEON;
    }
    return '#1a1a1a';
  };
  const segGlow = (i: number): string => {
    if (i < SEGS - activeSegs) return 'none';
    if (i >= SEGS - 2) return '0 0 5px #ff4444';
    if (i >= SEGS - 4) return '0 0 5px #ffaa00';
    return `0 0 5px ${NEON}`;
  };

  const handlePct = 100 - value;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', gap: 5, alignItems: 'stretch', height: 80 }}>

        {/* LED column */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px 0' }}>
          {Array.from({ length: SEGS }).map((_, i) => (
            <div key={i} style={{
              width: 3, height: 5, borderRadius: 1,
              background: segColor(i),
              boxShadow: segGlow(i),
              transition: 'background 0.04s',
            }} />
          ))}
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          style={{
            width: 22, height: 80, position: 'relative', cursor: 'ns-resize',
            background: 'linear-gradient(90deg, #080808 0%, #141414 40%, #0d0d0d 100%)',
            borderRadius: 6,
            border: '1px solid #2a2a2a',
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Track center rail */}
          <div style={{
            position: 'absolute', left: '50%', top: 6, bottom: 6,
            width: 2, transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #222, #333, #222)',
            borderRadius: 1,
          }} />

          {/* Fill glow */}
          <div style={{
            position: 'absolute', bottom: 6, left: 3, right: 3,
            height: `calc(${value}% - 6px)`,
            background: `linear-gradient(0deg, ${NEON} 0%, rgba(183,255,0,0.18) 100%)`,
            borderRadius: '0 0 4px 4px',
            boxShadow: `0 0 14px rgba(183,255,0,0.3)`,
            transition: 'height 0.04s',
            minHeight: 0,
          }} />

          {/* Knurled aluminum handle */}
          <div style={{
            position: 'absolute', left: -1, right: -1, height: 16,
            top: `${handlePct}%`, transform: 'translateY(-50%)',
            pointerEvents: 'none',
            borderRadius: 4,
            background: 'linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 15%, #888 35%, #666 50%, #888 65%, #c0c0c0 85%, #e0e0e0 100%)',
            boxShadow: `0 2px 8px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.3), 0 0 ${hovered ? '10px' : '4px'} rgba(183,255,0,0.25)`,
            border: '1px solid #444',
          }}>
            {/* Knurl lines */}
            {[3, 6, 9, 12].map(x => (
              <div key={x} style={{
                position: 'absolute', top: 3, bottom: 3, left: x,
                width: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 1,
              }} />
            ))}
            {/* Center highlight stripe */}
            <div style={{
              position: 'absolute', left: 2, right: 2, top: '50%', height: 2,
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 1,
            }} />
          </div>
        </div>
      </div>

      <span style={{ fontSize: 9, color: NEON, fontWeight: 800, letterSpacing: 1.5, textShadow: `0 0 8px rgba(183,255,0,0.4)` }}>{label}</span>
      <span style={{ fontSize: 10, color: '#999', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}>{Math.round(value)}%</span>
    </div>
  );
};
