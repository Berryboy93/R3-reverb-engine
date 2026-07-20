/**
 * audioEngine — statechange edge-case tests
 *
 * Covers the scenario where the browser reports AudioContext.state === 'running'
 * immediately after creation (Firefox / older Safari under strict autoplay
 * policies) but audio is actually gated.  The engine must:
 *
 *  1. Call resume() before any long async operation so the user-gesture token
 *     is consumed while it is still valid.
 *  2. Register a 'statechange' listener and surface state transitions to the UI
 *     via onStateChange() so the unlock banner can reappear if needed.
 */

import { R3V4AudioEngine } from '../audioEngine';

// ---------------------------------------------------------------------------
// Minimal AudioContext mock helpers
// ---------------------------------------------------------------------------

type StateChangeListener = () => void;

interface MockAudioContext {
  state: AudioContextState;
  sampleRate: number;
  currentTime: number;
  destination: object;
  resume: jest.Mock<Promise<void>>;
  suspend: jest.Mock<Promise<void>>;
  close: jest.Mock<Promise<void>>;
  createAnalyser: jest.Mock;
  createGain: jest.Mock;
  createOscillator: jest.Mock;
  createMediaStreamSource: jest.Mock;
  addEventListener: jest.Mock<void, [string, StateChangeListener]>;
  removeEventListener: jest.Mock;
  audioWorklet: { addModule: jest.Mock<Promise<void>> };
  _stateListeners: StateChangeListener[];
  _simulateStateChange(newState: AudioContextState): void;
}

function makeMockContext(initialState: AudioContextState = 'suspended'): MockAudioContext {
  const listeners: StateChangeListener[] = [];

  const ctx: MockAudioContext = {
    state: initialState,
    sampleRate: 48000,
    currentTime: 0,
    destination: {},
    resume: jest.fn(async () => { ctx.state = 'running'; }),
    suspend: jest.fn(async () => { ctx.state = 'suspended'; }),
    close: jest.fn(async () => {}),
    createAnalyser: jest.fn(() => ({
      fftSize: 256,
      frequencyBinCount: 128,
      connect: jest.fn(),
      disconnect: jest.fn(),
      getByteFrequencyData: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
    createOscillator: jest.fn(() => ({
      type: 'sine',
      frequency: { value: 440 },
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createMediaStreamSource: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
    addEventListener: jest.fn((event: string, handler: StateChangeListener) => {
      if (event === 'statechange') listeners.push(handler);
    }),
    removeEventListener: jest.fn(),
    audioWorklet: {
      addModule: jest.fn(async () => {}),
    },
    _stateListeners: listeners,
    _simulateStateChange(newState: AudioContextState) {
      this.state = newState;
      listeners.forEach(fn => fn());
    },
  };

  return ctx;
}

// Build a minimal AudioWorkletNode mock
function makeWorkletNode() {
  return {
    port: { onmessage: null, postMessage: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn(),
    parameters: { get: jest.fn(() => null) },
  };
}

// ---------------------------------------------------------------------------
// Per-test setup: replace global AudioContext and AudioWorkletNode
// ---------------------------------------------------------------------------

let mockCtx: MockAudioContext;

beforeEach(() => {
  mockCtx = makeMockContext('suspended');

  // Replace global AudioContext
  (globalThis as any).AudioContext = jest.fn(() => mockCtx);

  // Replace global AudioWorkletNode
  (globalThis as any).AudioWorkletNode = jest.fn(() => makeWorkletNode());

  // Stub fetch so the worklet module load never hits the network
  (globalThis as any).fetch = jest.fn(async () => ({
    text: async () => '/* stub processor */',
  }));

  // Stub URL helpers used to load the worklet blob
  (globalThis as any).URL = {
    createObjectURL: jest.fn(() => 'blob:stub'),
    revokeObjectURL: jest.fn(),
  };

  // Stub Blob
  (globalThis as any).Blob = jest.fn(() => ({}));
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('R3V4AudioEngine — statechange handling', () => {
  it('registers a statechange listener on the AudioContext after init', async () => {
    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    expect(mockCtx.addEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    );
  });

  it('calls resume() before the worklet addModule to consume the gesture token early', async () => {
    const callOrder: string[] = [];
    mockCtx.resume.mockImplementation(async () => {
      callOrder.push('resume');
      mockCtx.state = 'running';
    });
    mockCtx.audioWorklet.addModule.mockImplementation(async () => {
      callOrder.push('addModule');
    });

    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    const resumeIdx = callOrder.indexOf('resume');
    const addModuleIdx = callOrder.indexOf('addModule');
    expect(resumeIdx).toBeGreaterThanOrEqual(0);
    expect(addModuleIdx).toBeGreaterThanOrEqual(0);
    expect(resumeIdx).toBeLessThan(addModuleIdx);
  });

  it('fires onStateChange when context transitions to suspended after init', async () => {
    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    const stateChanges: AudioContextState[] = [];
    engine.onStateChange(state => stateChanges.push(state));

    // Simulate browser silently suspending the context (e.g. tab backgrounded)
    mockCtx._simulateStateChange('suspended');

    expect(stateChanges).toEqual(['suspended']);
  });

  it('fires onStateChange when context recovers to running after being suspended', async () => {
    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    const stateChanges: AudioContextState[] = [];
    engine.onStateChange(state => stateChanges.push(state));

    mockCtx._simulateStateChange('suspended');
    mockCtx._simulateStateChange('running');

    expect(stateChanges).toEqual(['suspended', 'running']);
  });

  it('reports isRunning correctly after a simulated statechange', async () => {
    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    // Initially running after init
    expect(engine.isRunning).toBe(true);

    // Browser suspends
    mockCtx._simulateStateChange('suspended');
    expect(engine.isRunning).toBe(false);

    // Resume call brings it back
    mockCtx._simulateStateChange('running');
    expect(engine.isRunning).toBe(true);
  });

  it('handles the "running-but-gated" edge case: context starts running, then immediately suspends', async () => {
    // Simulate Firefox/Safari: AudioContext is created in 'running' state
    mockCtx = makeMockContext('running');
    (globalThis as any).AudioContext = jest.fn(() => mockCtx);
    // resume() is a no-op since it's already running
    mockCtx.resume.mockImplementation(async () => {});

    const engine = new R3V4AudioEngine();
    const stateChanges: AudioContextState[] = [];

    await engine.initialize('test-tone');
    engine.onStateChange(state => stateChanges.push(state));

    // Engine sees it as running
    expect(engine.isRunning).toBe(true);

    // Browser then gates it (the actual gated-running scenario)
    mockCtx._simulateStateChange('suspended');

    expect(stateChanges).toEqual(['suspended']);
    expect(engine.isRunning).toBe(false);
  });

  it('does not invoke onStateChange before the callback is registered', async () => {
    const engine = new R3V4AudioEngine();
    await engine.initialize('test-tone');

    // Simulate a statechange BEFORE registering a callback — must not throw
    expect(() => mockCtx._simulateStateChange('suspended')).not.toThrow();

    // Register callback after the fact
    const stateChanges: AudioContextState[] = [];
    engine.onStateChange(state => stateChanges.push(state));

    // Only future transitions fire the callback
    mockCtx._simulateStateChange('running');
    expect(stateChanges).toEqual(['running']);
  });
});
