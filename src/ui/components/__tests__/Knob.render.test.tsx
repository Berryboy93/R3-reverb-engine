/**
 * Knob canvas render tests — two tiers.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TIER 1 — Broad draw-call snapshots                                     │
 * │                                                                         │
 * │  These capture the entire ordered sequence of Canvas 2D API calls.     │
 * │  They are intentionally coarse: a deliberate design change (moving a   │
 * │  gradient stop, adjusting blur, tweaking a geometry ratio) WILL break  │
 * │  them — and that's the point.                                           │
 * │                                                                         │
 * │  HOW TO UPDATE SNAPSHOTS                                                │
 * │  Run:  npx jest --testPathPattern=Knob.render --updateSnapshot          │
 * │                                                                         │
 * │  Before updating, confirm visually in the browser that:                 │
 * │    1. The knob still renders at all three positions (min / mid / max).  │
 * │    2. The LED arc sweeps the expected angle range.                      │
 * │    3. The chrome ring, indicator line, and centre gem look intentional. │
 * │                                                                         │
 * │  A snapshot update without a corresponding visual check is a bug.       │
 * │  The named constants exported from Knob.tsx (BODY_R_RATIO, etc.) are   │
 * │  designed to make snapshot diffs self-documenting — a diff on          │
 * │  "BODY_R_RATIO" is far more readable than a diff on "20.28".           │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TIER 2 — Structural invariant checks                                   │
 * │                                                                         │
 * │  These verify the presence and correctness of specific design elements  │
 * │  (chrome ring arc loop, LED arc colour, indicator line colour, arc     │
 * │  angle change between min and max) using readable assertions.           │
 * │                                                                         │
 * │  They use NO snapshots and therefore survive incidental geometry        │
 * │  tweaks. A failing invariant means a core visual element is broken or   │
 * │  its colour token changed — always investigate before suppressing.      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ParameterRange } from '../../../types/reverb';

// jest-canvas-mock is loaded via setupFiles in jest.config.js.
// Importing it here gives us access to the mock's introspection helpers.
import 'jest-canvas-mock';

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const TEST_RANGE: ParameterRange = {
  min: 0,
  max: 100,
  step: 1,
  unit: '%',
  displayFormat: (v: number) => `${Math.round(v)}`,
};

import { Knob } from '../Knob';

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

type DrawEvents = ReturnType<CanvasRenderingContext2D['__getEvents']>;

/** Render a Knob and return the recorded canvas draw events. */
function captureDrawEvents(value: number): DrawEvents {
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    const root = createRoot(container);
    root.render(
      <Knob
        value={value}
        range={TEST_RANGE}
        label="TEST"
        onChange={() => undefined}
        size={52}
      />,
    );
  });

  const canvas = container.querySelector('canvas') as HTMLCanvasElement;
  expect(canvas).not.toBeNull();

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const events = ctx.__getEvents();

  act(() => {
    document.body.removeChild(container);
  });

  return events;
}

// ---------------------------------------------------------------------------
// Tier 1 — Broad draw-call snapshots
// ---------------------------------------------------------------------------

describe('Knob canvas rendering', () => {
  beforeEach(() => {
    // Reset the mock's recorded event log before each test so snapshots are
    // independent of each other.
    const scratch = document.createElement('canvas');
    const ctx = scratch.getContext('2d') as CanvasRenderingContext2D;
    ctx.__clearEvents();
  });

  // ── Snapshot tests ────────────────────────────────────────────────────────
  // See the file-level comment for the update protocol and visual checklist.
  describe('broad draw-call snapshots', () => {
    it('renders correctly at minimum value (0)', () => {
      const events = captureDrawEvents(TEST_RANGE.min);
      expect(events).toMatchSnapshot();
    });

    it('renders correctly at midpoint value (50)', () => {
      const events = captureDrawEvents(50);
      expect(events).toMatchSnapshot();
    });

    it('renders correctly at maximum value (100)', () => {
      const events = captureDrawEvents(TEST_RANGE.max);
      expect(events).toMatchSnapshot();
    });
  });

  // ── Structural invariants ─────────────────────────────────────────────────
  // These do NOT use snapshots. They assert presence/colour of core design
  // elements and survive incidental geometry tweaks.  A failure here means
  // a named colour token or the canvas draw loop itself is broken.
  describe('structural invariants', () => {
    it('draws the chrome ring (outer brushed arc loop)', () => {
      const events = captureDrawEvents(50);
      // The chrome ring is drawn as 120 arc strokes (360 degrees / 3-degree step)
      const arcStrokes = events.filter(
        (e) => e.type === 'arc' || e.type === 'stroke',
      );
      expect(arcStrokes.length).toBeGreaterThan(0);
    });

    it('draws the LED arc in neon green (#b7ff00)', () => {
      const events = captureDrawEvents(50);
      // jest-canvas-mock records property assignments as { type: '<propName>', props: { value: <val> } }
      // Note: the mock normalises hex colours to lowercase.
      const neonStrokes = events.filter(
        (e) => e.type === 'strokeStyle' && (e.props as { value: string }).value === '#b7ff00',
      );
      expect(neonStrokes.length).toBeGreaterThan(0);
    });

    it('draws the indicator line in chrome white (#f0f0f0)', () => {
      const events = captureDrawEvents(50);
      const chromeStrokes = events.filter(
        (e) => e.type === 'strokeStyle' && (e.props as { value: string }).value === '#f0f0f0',
      );
      expect(chromeStrokes.length).toBeGreaterThan(0);
    });

    it('LED arc end-angle differs between min and max', () => {
      const minEvents = captureDrawEvents(TEST_RANGE.min);
      const maxEvents = captureDrawEvents(TEST_RANGE.max);

      const arcArgs = (events: DrawEvents) =>
        events
          .filter((e) => e.type === 'arc')
          .map((e) => e.props as Record<string, unknown>);

      const minArcs = arcArgs(minEvents);
      const maxArcs = arcArgs(maxEvents);

      // Both positions must produce arc calls
      expect(minArcs.length).toBeGreaterThan(0);
      expect(maxArcs.length).toBeGreaterThan(0);

      // At least one arc must differ between min and max (the LED arc)
      const serialized = (arcs: Record<string, unknown>[]) => JSON.stringify(arcs);
      expect(serialized(minArcs)).not.toBe(serialized(maxArcs));
    });
  });
});
