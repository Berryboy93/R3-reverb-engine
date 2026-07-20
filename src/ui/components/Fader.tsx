import React, { useState, useRef, useEffect } from 'react';

// ─── Design tokens ──────────────────────────────────────────────────────────
// Colour constants — changing these intentionally requires a snapshot update.
const NEON = '#B7FF00';
/** Inactive LED segment colour. */
const LED_DARK = '#1a1a1a';
/** Clip-zone LED colour (top segments). */
const LED_CLIP = '#ff4444';
/** Hot-zone LED colour. */
const LED_HOT = '#ffaa00';

// Geometry constants — named so that a snapshot diff names the constant that
// moved rather than showing an unexplained pixel value.
/** Number of LED meter segments. */
const LED_SEGMENTS = 12;
/** Number of top segments in the clip zone. */
const CLIP_ZONE_SEGS = 2;
/** Number of top segments in the clip + hot zones combined. */
const HOT_ZONE_SEGS = 4;
/** LED segment width (px). */
const LED_SEG_WIDTH = 3;
/** LED segment height (px). */
const LED_SEG_HEIGHT = 5;
/** Fader track width (px). */
const TRACK_WIDTH = 22;
/** Fader track height (px). */
const TRACK_HEIGHT = 80;
/** Inset of the rail / fill from the track ends (px). */
const TRACK_INSET = 6;
/** Thumb handle height (px). */
const HANDLE_HEIGHT = 16;

interface FaderProps {
  value: number;
  label: string;
  onChange: (value: number) => void;
}

export const Fader: React.FC<FaderProps> = ({ value, label, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = 1 - (e.clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(100, pct * 100)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateFromPointer(e);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => { if (dragging) updateFromPointer(e); };
    const handleUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging]);

  const activeSegs = Math.round((value / 100) * LED_SEGMENTS);
  const segColor = (i: number) => {
    if (i >= LED_SEGMENTS - activeSegs) {
      if (i >= LED_SEGMENTS - CLIP_ZONE_SEGS) return LED_CLIP;
      if (i >= LED_SEGMENTS - HOT_ZONE_SEGS) return LED_HOT;
      return NEON;
    }
    return LED_DARK;
  };
  const segGlow = (i: number): string => {
    if (i < LED_SEGMENTS - activeSegs) return 'none';
    if (i >= LED_SEGMENTS - CLIP_ZONE_SEGS) return `0 0 5px ${LED_CLIP}`;
    if (i >= LED_SEGMENTS - HOT_ZONE_SEGS) return `0 0 5px ${LED_HOT}`;
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
          {Array.from({ length: LED_SEGMENTS }).map((_, i) => (
            <div key={i} style={{
              width: LED_SEG_WIDTH, height: LED_SEG_HEIGHT, borderRadius: 1,
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
            width: TRACK_WIDTH, height: TRACK_HEIGHT, position: 'relative', cursor: 'ns-resize',
            background: 'linear-gradient(90deg, #080808 0%, #141414 40%, #0d0d0d 100%)',
            borderRadius: 6,
            border: '1px solid #2a2a2a',
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
        >
          {/* Track center rail */}
          <div style={{
            position: 'absolute', left: '50%', top: TRACK_INSET, bottom: TRACK_INSET,
            width: 2, transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #222, #333, #222)',
            borderRadius: 1,
          }} />

          {/* Fill glow */}
          <div style={{
            position: 'absolute', bottom: TRACK_INSET, left: 3, right: 3,
            height: `calc(${value}% - ${TRACK_INSET}px)`,
            background: `linear-gradient(0deg, ${NEON} 0%, rgba(183,255,0,0.18) 100%)`,
            borderRadius: '0 0 4px 4px',
            boxShadow: `0 0 14px rgba(183,255,0,0.3)`,
            transition: 'height 0.04s',
            minHeight: 0,
          }} />

          {/* Knurled aluminum handle */}
          <div style={{
            position: 'absolute', left: -1, right: -1, height: HANDLE_HEIGHT,
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
