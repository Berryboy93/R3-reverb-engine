/**
 * Fader DOM render tests — two tiers.
 *
 * Unlike Knob, Fader draws its UI entirely with HTML/CSS — there is no Canvas.
 * The same two-tier pattern as Knob.render.test.tsx is applied here:
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TIER 1 — Broad draw-call snapshots                                     │
 * │                                                                         │
 * │  These capture the full rendered innerHTML at min / mid / max values.  │
 * │  They are intentionally coarse: a deliberate design change (moving a   │
 * │  gradient stop, resizing the track, tweaking the handle) WILL break    │
 * │  them — and that's the point.                                           │
 * │                                                                         │
 * │  HOW TO UPDATE SNAPSHOTS                                                │
 * │  Run:  npx jest --testPathPatterns=Fader.render --updateSnapshot        │
 * │                                                                         │
 * │  Before updating, confirm visually in the browser that:                 │
 * │    1. The fader still renders at all three positions (min / mid / max). │
 * │    2. The fill glow tracks the value and the handle sits at the right   │
 * │       height.                                                           │
 * │    3. The LED meter zones (green / hot amber / clip red) look           │
 * │       intentional.                                                      │
 * │                                                                         │
 * │  A snapshot update without a corresponding visual check is a bug.       │
 * │  The named constants in Fader.tsx (LED_SEGMENTS, TRACK_INSET, etc.)     │
 * │  are designed to make snapshot diffs self-documenting — a diff on       │
 * │  "TRACK_INSET" is far more readable than a diff on "6".                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TIER 2 — Structural invariant checks                                   │
 * │                                                                         │
 * │  These verify the presence and correctness of specific design elements  │
 * │  (track groove, fill glow, thumb handle, LED zone-boundary colours)     │
 * │  using readable assertions.                                             │
 * │                                                                         │
 * │  They use NO snapshots and therefore survive incidental geometry        │
 * │  tweaks. A failing invariant means a core visual element is broken or   │
 * │  its colour token changed — always investigate before suppressing.      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Fader } from '../Fader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a Fader and return the host container element. */
function renderFader(value: number): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    const root = createRoot(container);
    root.render(
      <Fader value={value} label="TEST" onChange={() => undefined} />,
    );
  });

  return container;
}

/** Tear down a container created by renderFader. */
function cleanup(container: HTMLDivElement): void {
  act(() => {
    document.body.removeChild(container);
  });
}

/** Return the 12 LED segment divs (top→bottom) from a rendered Fader. */
function getLEDSegments(container: HTMLDivElement): HTMLDivElement[] {
  const allDivs = Array.from(container.querySelectorAll<HTMLDivElement>('div'));
  return allDivs.filter(
    (el) => el.style.width === '3px' && el.style.height === '5px',
  );
}

// JSDOM normalises hex colours to rgb() — define canonical expected values here
// so a zone-boundary refactor still fails with a readable colour mismatch.
const DARK  = 'rgb(26, 26, 26)';   // #1a1a1a  — inactive segment
const CLIP  = 'rgb(255, 68, 68)';  // #ff4444  — clip zone
const AMBER = 'rgb(255, 170, 0)';  // #ffaa00  — hot zone

describe('Fader DOM rendering', () => {
  // ── Snapshot tests ────────────────────────────────────────────────────────
  // See the file-level comment for the update protocol and visual checklist.
  describe('broad draw-call snapshots', () => {
    it('renders correctly at minimum value (0)', () => {
      const container = renderFader(0);
      expect(container.innerHTML).toMatchSnapshot();
      cleanup(container);
    });

    it('renders correctly at midpoint value (50)', () => {
      const container = renderFader(50);
      expect(container.innerHTML).toMatchSnapshot();
      cleanup(container);
    });

    it('renders correctly at maximum value (100)', () => {
      const container = renderFader(100);
      expect(container.innerHTML).toMatchSnapshot();
      cleanup(container);
    });
  });

  // ── Structural invariants ─────────────────────────────────────────────────
  // These do NOT use snapshots. They assert presence/colour of core design
  // elements and survive incidental geometry tweaks.
  describe('structural invariants', () => {
    it('renders the track groove (center rail div)', () => {
      const container = renderFader(50);
      // The track groove is the inner absolutely-positioned center rail div
      // identified by its translateX(-50%) transform.
      const allDivs = Array.from(container.querySelectorAll('div'));
      const groove = allDivs.find(
        (el) =>
          el.style.transform === 'translateX(-50%)' &&
          el.style.position === 'absolute',
      );
      expect(groove).toBeDefined();
      cleanup(container);
    });

    it('renders the fill glow reflecting the fader value', () => {
      const container = renderFader(75);
      const allDivs = Array.from(container.querySelectorAll('div'));
      // The fill glow is identified by its gradient that contains the neon
      // colour #B7FF00 and is positioned at the bottom of the track.
      const fillGlow = allDivs.find(
        (el) =>
          el.style.backgroundImage?.toLowerCase().includes('#b7ff00') ||
          el.style.background?.toLowerCase().includes('#b7ff00'),
      );
      expect(fillGlow).toBeDefined();
      cleanup(container);
    });

    it('renders the knurled thumb handle', () => {
      const container = renderFader(50);
      const allDivs = Array.from(container.querySelectorAll('div'));
      // The handle is identified by its translateY(-50%) position style and
      // its absolutely-positioned placement within the track.
      const handle = allDivs.find(
        (el) =>
          el.style.transform === 'translateY(-50%)' &&
          el.style.position === 'absolute',
      );
      expect(handle).toBeDefined();
      cleanup(container);
    });

    it('fill glow height differs between min and max positions', () => {
      const minContainer = renderFader(0);
      const maxContainer = renderFader(100);

      const fillGlow = (container: HTMLDivElement) => {
        const allDivs = Array.from(container.querySelectorAll('div'));
        return allDivs.find(
          (el) =>
            el.style.background?.toLowerCase().includes('#b7ff00') &&
            el.style.position === 'absolute',
        );
      };

      const minGlow = fillGlow(minContainer);
      const maxGlow = fillGlow(maxContainer);

      expect(minGlow).toBeDefined();
      expect(maxGlow).toBeDefined();

      // The fill height is driven by the value prop; it must differ
      expect(minGlow!.style.height).not.toBe(maxGlow!.style.height);

      cleanup(minContainer);
      cleanup(maxContainer);
    });

    it('renders the label and value readout', () => {
      const container = renderFader(42);
      const text = container.textContent ?? '';
      expect(text).toContain('TEST');
      expect(text).toContain('42%');
      cleanup(container);
    });

    it('LED meter has 12 segments', () => {
      const container = renderFader(50);
      const segments = getLEDSegments(container);
      expect(segments).toHaveLength(12);
      cleanup(container);
    });

    // ── LED zone-colour invariants ──────────────────────────────────────────
    //
    // The 12 LED segments are indexed 0 (top) → 11 (bottom) in DOM order.
    // Zone boundaries:
    //   indices 10–11  →  clip zone  (#ff4444)
    //   indices  8–9   →  hot zone   (#ffaa00)
    //   indices  0–7   →  neon green (#B7FF00)
    //   any inactive   →  dark       (#1a1a1a)
    //
    // These tests pin the colour at specific value thresholds so that a
    // refactor moving zone boundaries fails loudly rather than silently.

    it('all 12 segments are dark (#1a1a1a) at value 0', () => {
      const container = renderFader(0);
      const segs = getLEDSegments(container);

      expect(segs).toHaveLength(12);
      segs.forEach((seg) => {
        expect(seg.style.background).toBe(DARK);
      });

      cleanup(container);
    });

    it.each([84, 92, 100])(
      'clip-zone segments (indices 10–11) are #ff4444 at value %i',
      (value) => {
        const container = renderFader(value);
        const segs = getLEDSegments(container);

        expect(segs).toHaveLength(12);
        expect(segs[10].style.background).toBe(CLIP);
        expect(segs[11].style.background).toBe(CLIP);

        cleanup(container);
      },
    );

    it.each([67, 75, 83])(
      'hot-zone segments (indices 8–9) are #ffaa00 at value %i',
      (value) => {
        const container = renderFader(value);
        const segs = getLEDSegments(container);

        expect(segs).toHaveLength(12);
        expect(segs[8].style.background).toBe(AMBER);
        expect(segs[9].style.background).toBe(AMBER);

        cleanup(container);
      },
    );

    it('clip-zone segments (indices 10–11) are dark (#1a1a1a) at value 0', () => {
      const container = renderFader(0);
      const segs = getLEDSegments(container);

      expect(segs[10].style.background).toBe(DARK);
      expect(segs[11].style.background).toBe(DARK);

      cleanup(container);
    });

    it('hot-zone segments (indices 8–9) are dark (#1a1a1a) at value 0', () => {
      const container = renderFader(0);
      const segs = getLEDSegments(container);

      expect(segs[8].style.background).toBe(DARK);
      expect(segs[9].style.background).toBe(DARK);

      cleanup(container);
    });
  });
});
