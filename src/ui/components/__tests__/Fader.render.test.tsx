/**
 * Fader DOM render snapshot tests.
 *
 * Unlike Knob, Fader draws its UI entirely with HTML/CSS — there is no Canvas.
 * We render at min, mid, and max values, then snapshot the outer container's
 * innerHTML so that any unintentional geometry or colour change is caught.
 *
 * Structural invariant checks additionally assert that the three key visual
 * elements (track groove, fill glow, and knurled thumb handle) are always
 * present in the rendered output.
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

// ---------------------------------------------------------------------------
// Snapshot tests
// ---------------------------------------------------------------------------

describe('Fader DOM rendering', () => {
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

  // -------------------------------------------------------------------------
  // Structural invariant checks (fail fast with a readable message)
  // -------------------------------------------------------------------------

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
    // Each LED segment is a narrow div (width: 3px, height: 5px).
    const allDivs = Array.from(container.querySelectorAll('div'));
    const segments = allDivs.filter(
      (el) => el.style.width === '3px' && el.style.height === '5px',
    );
    expect(segments).toHaveLength(12);
    cleanup(container);
  });
});
