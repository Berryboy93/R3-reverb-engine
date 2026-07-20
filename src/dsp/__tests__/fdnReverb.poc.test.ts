/**
 * Proof-of-concept regression tests for the FDN reverb core.
 *
 * These feed a real impulse through the engine and assert on the actual
 * audio output. They guard against the three silent-failure bugs found in
 * the original DSP:
 *   1. Per-block pre-delay buffer allocation (engine output was total silence)
 *   2. Bitmask indexing on a non-power-of-two delay buffer (broken feedback)
 *   3. Incorrect Schroeder allpass (gain > 1 → exponential feedback blow-up)
 */
import { FDNReverbEngine } from '../FDNReverb';

const SR = 48000;
const BLOCK = 128;

function impulseResponse(
  params: Record<string, unknown>,
  seconds: number
): { rms: number[]; stereoDiff: number } {
  const engine = new FDNReverbEngine(SR, 2048);
  engine.setParameters({
    preDelay: 20, decay: 2.5, size: 65, diffusion: 78, damping: 42,
    highCut: 12000, lowCut: 120, bassDamping: 35, stereoWidth: 100,
    earlyReflections: 60, crosstalk: 50, modulation: 15,
    dry: 0, er: 40, wet: 100,
    freeze: false, ducking: false, tempoSync: true, oversampling: false,
    ...params,
  } as never);

  const inL = new Float32Array(BLOCK);
  const inR = new Float32Array(BLOCK);
  const outL = new Float32Array(BLOCK);
  const outR = new Float32Array(BLOCK);
  inL[0] = 1;
  inR[0] = 1;

  const rms: number[] = [];
  let stereoDiff = 0;
  const blocks = Math.ceil((SR * seconds) / BLOCK);
  for (let b = 0; b < blocks; b++) {
    engine.process(inL, inR, outL, outR, BLOCK);
    if (b === 0) {
      inL[0] = 0;
      inR[0] = 0;
    }
    let sum = 0;
    for (let i = 0; i < BLOCK; i++) {
      sum += outL[i] * outL[i];
      stereoDiff += Math.abs(outL[i] - outR[i]);
    }
    rms.push(Math.sqrt(sum / BLOCK));
  }
  return { rms, stereoDiff };
}

const rmsAt = (rms: number[], sec: number) => rms[Math.floor((sec * SR) / BLOCK)];

describe('FDNReverbEngine impulse response (true proof of concept)', () => {
  it('produces a non-silent, decaying, NaN-free reverb tail', () => {
    const { rms, stereoDiff } = impulseResponse({}, 3);

    const peak = Math.max(...rms);
    expect(peak).toBeGreaterThan(1e-4);           // not silent
    expect(peak).toBeLessThan(10);                // not exploding

    // Tail exists well after the impulse and decays over time
    expect(rmsAt(rms, 1.0)).toBeGreaterThan(1e-7);
    expect(rmsAt(rms, 0.1)).toBeGreaterThan(rmsAt(rms, 1.0));
    expect(rmsAt(rms, 1.0)).toBeGreaterThan(rmsAt(rms, 2.5));

    expect(rms.some(v => Number.isNaN(v))).toBe(false);
    expect(stereoDiff).toBeGreaterThan(0.01);     // stereo decorrelation
  });

  it('stays stable at extreme settings (long decay, max size, oversampling)', () => {
    const { rms } = impulseResponse(
      { decay: 20, size: 100, modulation: 100, oversampling: true },
      2
    );
    expect(Math.max(...rms)).toBeLessThan(10);
    expect(rms.some(v => Number.isNaN(v))).toBe(false);
  });

  it('respects pre-delay across process blocks', () => {
    // 100ms pre-delay >> 128-sample block: dry-only output must be silent
    // before the pre-delay elapses and present after it.
    const { rms } = impulseResponse(
      { preDelay: 100, dry: 100, er: 0, wet: 0 },
      0.3
    );
    expect(rmsAt(rms, 0.05)).toBe(0);
    const after = rms.slice(Math.floor((0.098 * SR) / BLOCK)).some(v => v > 1e-4);
    expect(after).toBe(true);
  });
});
