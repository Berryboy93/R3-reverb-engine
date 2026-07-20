/**
 * Knob canvas render snapshot tests.
 *
 * jest-canvas-mock intercepts every Canvas 2D API call and records them.
 * We render the Knob component at min, mid, and max positions, flush React's
 * effects with `act`, then snapshot the ordered sequence of draw events.
 *
 * A failing snapshot means the chrome ring, LED arc, or indicator geometry
 * changed — exactly the regression we want to catch before shipping.
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

// Dynamically imported so that jest-canvas-mock is already in place when the
// module is first evaluated (ts-jest compiles lazily, but the mock is set up
// at module load time via setupFiles, so this is fine as a top-level import).
import { Knob } from '../Knob';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a Knob and return the recorded canvas draw events. */
function captureDrawEvents(value: number): ReturnType<CanvasRenderingContext2D['__getEvents']> {
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

  // Clean up
  act(() => {
    document.body.removeChild(container);
  });

  return events;
}

// ---------------------------------------------------------------------------
// Snapshot tests
// ---------------------------------------------------------------------------

describe('Knob canvas rendering', () => {
  beforeEach(() => {
    // Reset the mock's recorded event log before each test so snapshots are
    // independent of each other.
    const scratch = document.createElement('canvas');
    const ctx = scratch.getContext('2d') as CanvasRenderingContext2D;
    ctx.__clearEvents();
  });

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

  // -------------------------------------------------------------------------
  // Structural invariant checks (fail fast with a readable message)
  // -------------------------------------------------------------------------

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
    // Note: the mock normalizes hex colors to lowercase.
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

    // Collect all arc calls (they carry the end-angle in their props)
    const arcArgs = (events: ReturnType<CanvasRenderingContext2D['__getEvents']>) =>
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
