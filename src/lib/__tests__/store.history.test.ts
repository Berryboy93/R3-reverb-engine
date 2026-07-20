/**
 * Store history coalescing tests — lock the undo/redo behavior around
 * rapid same-parameter edits (knob drags), undo-then-edit branching,
 * and max-history rollover.
 */
import { useR3V4Store } from '../store';

const getState = () => useR3V4Store.getState();

// Snapshot the pristine initial state once, then restore it before each test.
const initialState = useR3V4Store.getState();

describe('store history coalescing', () => {
  beforeEach(() => {
    useR3V4Store.setState({
      ...initialState,
      parameters: { ...initialState.parameters },
      history: [...initialState.history],
      historyIndex: 0,
    }, true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('coalesces rapid successive edits to the same parameter into one entry', () => {
    const before = getState().history.length;
    getState().setParameter('decay', 3.0); // first edit pushes a new entry
    for (let i = 0; i < 20; i++) {
      getState().setParameter('decay', 3.0 + i * 0.1); // drag: coalesced
    }
    expect(getState().history.length).toBe(before + 1);
    expect(getState().parameters.decay).toBeCloseTo(4.9);
  });

  it('starts a new entry when a different parameter is edited', () => {
    const before = getState().history.length;
    getState().setParameter('decay', 3.0);
    getState().setParameter('size', 70);
    expect(getState().history.length).toBe(before + 2);
  });

  it('starts a new entry when the coalesce window has elapsed', () => {
    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      const before = getState().history.length;
      getState().setParameter('decay', 3.0);
      now += 2_000; // beyond the coalesce window
      getState().setParameter('decay', 4.0);
      expect(getState().history.length).toBe(before + 2);
    } finally {
      Date.now = realNow;
    }
  });

  it('undo then edit truncates redo branch and pushes (never coalesces across an undo)', () => {
    getState().setParameter('decay', 3.0);
    getState().setParameter('size', 70);
    const lenAtTip = getState().history.length;

    getState().undo();
    expect(getState().historyIndex).toBe(lenAtTip - 2);

    // Editing after undo must create a fresh branch, not overwrite the undone tip
    getState().setParameter('size', 90);
    expect(getState().history.length).toBe(lenAtTip);
    expect(getState().historyIndex).toBe(lenAtTip - 1);
    expect(getState().parameters.size).toBe(90);

    // undo restores the pre-branch value
    getState().undo();
    expect(getState().parameters.decay).toBeCloseTo(3.0);
  });

  it('caps history at maxHistory on rollover', () => {
    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      const max = getState().maxHistory;
      for (let i = 0; i < max + 20; i++) {
        now += 2_000; // each edit outside the coalesce window
        getState().setParameter('decay', 0.1 + (i % 25));
      }
      expect(getState().history.length).toBeLessThanOrEqual(max);
      expect(getState().historyIndex).toBe(getState().history.length - 1);
    } finally {
      Date.now = realNow;
    }
  });
});
