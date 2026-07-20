/**
 * R3V4 Reverb Engine — Feedback Delay Network (FDN) Core
 * 
 * FIXED v1.0:
 *   - Hadamard: Raw build then single normalization (not recursive)
 *   - Decay: Clamped to MIN_DECAY=0.1 to prevent division by zero
 *   - NaN guards in all filter process() methods
 *   - Allpass delay minimum 1 sample
 *   - Freeze buffer bounds-checked
 */

import { ReverbParameters } from '../types/reverb';

const FDN_SIZE = 8;
// MUST be a power of two — read()/write() index with a bitmask (& MAX-1).
// Max needed: 79.9ms base × 2.3 size factor at 96kHz (2× oversampled) ≈ 17.7k samples.
const MAX_DELAY_SAMPLES = 32768;
const ALLPASS_STAGES = 4;
const MOD_LFO_RATE = 0.5;
const MOD_DEPTH_MS = 0.5;
const MIN_DECAY = 0.1;

const BASE_DELAYS_MS = [
  37.1, 43.7, 49.3, 55.9,
  61.3, 67.7, 73.1, 79.9
];

class AllpassFilter {
  private buffer: Float32Array;
  private index = 0;
  private delaySamples: number;

  constructor(sampleRate: number, delayMs: number) {
    this.delaySamples = Math.max(1, Math.round((delayMs / 1000) * sampleRate));
    this.buffer = new Float32Array(this.delaySamples + 1);
  }

  process(input: number, coeff: number): number {
    // Schroeder allpass lattice: w[n] = x[n] + c·w[n−N]; y[n] = −c·w[n] + w[n−N].
    // (Using x instead of w in the output tap breaks the allpass property and
    // turns the filter into a >1-gain amplifier — instant feedback blow-up.)
    const delayed = this.buffer[this.index];
    const w = input + coeff * delayed;
    this.buffer[this.index] = w;
    this.index = (this.index + 1) % this.buffer.length;
    return -coeff * w + delayed;
  }

  setDelayMs(sampleRate: number, delayMs: number): void {
    const newLen = Math.max(1, Math.round((delayMs / 1000) * sampleRate));
    if (newLen !== this.delaySamples) {
      this.delaySamples = newLen;
      this.buffer = new Float32Array(newLen + 1);
      this.index = 0;
    }
  }

  clear(): void {
    this.buffer.fill(0);
    this.index = 0;
  }
}

class OnePoleLPF {
  private state = 0;
  private coeff = 0;

  setCutoff(cutoffHz: number, sampleRate: number): void {
    const omega = 2 * Math.PI * Math.max(1, cutoffHz) / sampleRate;
    this.coeff = Math.exp(-omega);
    if (isNaN(this.coeff) || this.coeff < 0 || this.coeff >= 1) {
      this.coeff = 0.5;
    }
  }

  process(input: number): number {
    if (isNaN(input)) input = 0;
    this.state = (1 - this.coeff) * input + this.coeff * this.state;
    if (isNaN(this.state)) this.state = 0;
    return this.state;
  }

  clear(): void {
    this.state = 0;
  }
}

class OnePoleHPF {
  private state = 0;
  private coeff = 0;

  setCutoff(cutoffHz: number, sampleRate: number): void {
    const omega = 2 * Math.PI * Math.max(1, cutoffHz) / sampleRate;
    this.coeff = Math.exp(-omega);
    if (isNaN(this.coeff) || this.coeff < 0 || this.coeff >= 1) {
      this.coeff = 0.5;
    }
  }

  process(input: number): number {
    if (isNaN(input)) input = 0;
    this.state = (1 + this.coeff) * 0.5 * (input - this.state) + this.coeff * this.state;
    if (isNaN(this.state)) this.state = 0;
    return this.state;
  }

  clear(): void {
    this.state = 0;
  }
}

class FDNDelayLine {
  buffer: Float32Array;
  index = 0;
  delaySamples: number;
  lpf: OnePoleLPF;
  allpasses: AllpassFilter[];
  modPhase = 0;
  modDepth: number;
  baseDelayMs: number;

  constructor(sampleRate: number, delayMs: number, modDepthSamples: number) {
    this.baseDelayMs = delayMs;
    this.delaySamples = Math.max(1, Math.round((delayMs / 1000) * sampleRate));
    this.buffer = new Float32Array(MAX_DELAY_SAMPLES);
    this.lpf = new OnePoleLPF();
    this.allpasses = [];
    for (let i = 0; i < ALLPASS_STAGES; i++) {
      this.allpasses.push(new AllpassFilter(sampleRate, 2.5 + i * 1.8));
    }
    this.modDepth = modDepthSamples;
  }

  read(): number {
    const modOffset = Math.sin(this.modPhase) * this.modDepth;
    const readPos = this.index - this.delaySamples + modOffset;
    const i0 = Math.floor(readPos) & (MAX_DELAY_SAMPLES - 1);
    const i1 = (i0 + 1) & (MAX_DELAY_SAMPLES - 1);
    const frac = readPos - Math.floor(readPos);
    return this.buffer[i0] * (1 - frac) + this.buffer[i1] * frac;
  }

  write(value: number): void {
    this.buffer[this.index] = isNaN(value) ? 0 : value;
    this.index = (this.index + 1) & (MAX_DELAY_SAMPLES - 1);
  }

  processDiffusion(input: number): number {
    let out = input;
    for (const ap of this.allpasses) {
      out = ap.process(out, 0.7);
    }
    return out;
  }

  clear(): void {
    this.buffer.fill(0);
    this.index = 0;
    this.lpf.clear();
    this.allpasses.forEach(ap => ap.clear());
  }
}

class EarlyReflections {
  private taps: { delay: number; gain: number }[] = [];
  private buffer: Float32Array;
  private index = 0;
  private sampleRate: number;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.buffer = new Float32Array(Math.round(sampleRate * 0.15));
    this.generateTaps();
  }

  private generateTaps(): void {
    const tapTimes = [5, 12, 18, 25, 32, 40, 48, 58, 70, 85, 100, 120];
    const tapGains = [0.8, 0.6, 0.5, 0.7, 0.4, 0.5, 0.3, 0.6, 0.4, 0.3, 0.2, 0.15];
    this.taps = tapTimes.map((t, i) => ({
      delay: Math.round((t / 1000) * this.sampleRate),
      gain: tapGains[i]
    }));
  }

  process(input: number, amount: number): number {
    this.buffer[this.index] = isNaN(input) ? 0 : input;
    let out = 0;
    for (const tap of this.taps) {
      const idx = (this.index - tap.delay + this.buffer.length) % this.buffer.length;
      out += this.buffer[idx] * tap.gain;
    }
    this.index = (this.index + 1) % this.buffer.length;
    return out * amount;
  }

  clear(): void {
    this.buffer.fill(0);
    this.index = 0;
  }
}

export class FDNReverbEngine {
  private sampleRate: number;
  private delayLines: FDNDelayLine[];
  private earlyReflections: EarlyReflections;
  private inputHPF: OnePoleHPF;
  private outputLPF: OnePoleLPF;
  private outputHPF: OnePoleHPF;
  private parameters: ReverbParameters;
  private modRate: number;
  private oversampleFactor = 1;
  private oversampleBufferL: Float32Array;
  private oversampleBufferR: Float32Array;
  private peakInputL = 0;
  private peakInputR = 0;
  private peakOutputL = 0;
  private peakOutputR = 0;
  private isFrozen = false;
  private freezeBufferL: Float32Array | null = null;
  private freezeBufferR: Float32Array | null = null;
  private freezeIndex = 0;
  private hadamard: number[][];
  // Persistent pre-delay ring buffers (max 500ms at 96kHz = 48000 samples).
  // CRITICAL: these must survive across process() blocks — allocating them
  // per-block silently discards all delayed audio when preDelay > blockSize.
  private preDelayBufL = new Float32Array(65536);
  private preDelayBufR = new Float32Array(65536);
  private preDelayIdx = 0;

  constructor(sampleRate: number, maxBlockSize = 2048) {
    this.sampleRate = sampleRate;
    this.parameters = { ...this.getDefaultParams() };
    this.modRate = (2 * Math.PI * MOD_LFO_RATE) / sampleRate;
    this.oversampleBufferL = new Float32Array(maxBlockSize * 2);
    this.oversampleBufferR = new Float32Array(maxBlockSize * 2);

    this.hadamard = this.buildHadamard(FDN_SIZE);

    this.delayLines = BASE_DELAYS_MS.map((ms, i) => {
      const modDepth = (MOD_DEPTH_MS / 1000) * sampleRate * (1 + i * 0.1);
      return new FDNDelayLine(sampleRate, ms, modDepth);
    });

    this.earlyReflections = new EarlyReflections(sampleRate);
    this.inputHPF = new OnePoleHPF();
    this.outputLPF = new OnePoleLPF();
    this.outputHPF = new OnePoleHPF();

    this.updateFilters();
  }

  private getDefaultParams(): ReverbParameters {
    return {
      preDelay: 45, decay: 2.5, size: 65, diffusion: 78, damping: 42,
      highCut: 12000, lowCut: 120, bassDamping: 35, stereoWidth: 100,
      earlyReflections: 60, crosstalk: 50, dry: 80, er: 40, wet: 25,
      modulation: 15, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    };
  }

  /**
   * FIXED: Build raw Hadamard with entries +/-1, then normalize ONCE by 1/sqrt(n)
   * Previous bug: normalization was applied at every recursive level, compounding.
   */
  private buildHadamard(n: number): number[][] {
    const raw = this.buildRawHadamard(n);
    const norm = 1 / Math.sqrt(n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        raw[i][j] *= norm;
      }
    }
    return raw;
  }

  private buildRawHadamard(n: number): number[][] {
    if (n === 1) return [[1]];
    const half = this.buildRawHadamard(n / 2);
    const result: number[][] = [];
    for (let i = 0; i < n; i++) result.push(new Array(n).fill(0));
    for (let i = 0; i < n / 2; i++) {
      for (let j = 0; j < n / 2; j++) {
        result[i][j] = half[i][j];
        result[i][j + n / 2] = half[i][j];
        result[i + n / 2][j] = half[i][j];
        result[i + n / 2][j + n / 2] = -half[i][j];
      }
    }
    return result;
  }

  setParameters(params: Partial<ReverbParameters>): void {
    const oldParams = { ...this.parameters };
    this.parameters = { ...this.parameters, ...params };

    if (params.lowCut !== undefined || params.highCut !== undefined || params.damping !== undefined) {
      this.updateFilters();
    }

    if (params.size !== undefined && params.size !== oldParams.size) {
      this.updateDelayLengths();
    }

    if (params.freeze !== undefined && params.freeze !== oldParams.freeze) {
      if (params.freeze) {
        this.isFrozen = true;
        this.captureFreezeState();
      } else {
        this.isFrozen = false;
        this.freezeBufferL = null;
        this.freezeBufferR = null;
      }
    }

    if (params.oversampling !== undefined) {
      this.oversampleFactor = params.oversampling ? 2 : 1;
    }
  }

  private updateFilters(): void {
    this.inputHPF.setCutoff(this.parameters.lowCut, this.sampleRate);
    this.outputLPF.setCutoff(this.parameters.highCut, this.sampleRate);
    const dampingFreq = 200 + (1 - this.parameters.damping / 100) * 18000;
    for (const line of this.delayLines) {
      line.lpf.setCutoff(dampingFreq, this.sampleRate);
    }
    this.outputHPF.setCutoff(20, this.sampleRate);
  }

  private updateDelayLengths(): void {
    const sizeFactor = 0.3 + (this.parameters.size / 100) * 2.0;
    for (let i = 0; i < FDN_SIZE; i++) {
      const newMs = BASE_DELAYS_MS[i] * sizeFactor;
      this.delayLines[i].delaySamples = Math.max(1, Math.round((newMs / 1000) * this.sampleRate));
    }
  }

  private captureFreezeState(): void {
    const captureLen = Math.min(48000, this.delayLines[0].buffer.length);
    this.freezeBufferL = new Float32Array(captureLen);
    this.freezeBufferR = new Float32Array(captureLen);
    for (let i = 0; i < captureLen; i++) {
      const idx0 = (this.delayLines[0].index - i + this.delayLines[0].buffer.length) % this.delayLines[0].buffer.length;
      const idx1 = (this.delayLines[1].index - i + this.delayLines[1].buffer.length) % this.delayLines[1].buffer.length;
      this.freezeBufferL[i] = this.delayLines[0].buffer[idx0] || 0;
      this.freezeBufferR[i] = this.delayLines[1].buffer[idx1] || 0;
    }
    this.freezeIndex = 0;
  }

  process(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array,
    numSamples: number
  ): void {
    if (this.oversampleFactor === 2) {
      this.processOversampled(inputL, inputR, outputL, outputR, numSamples);
      return;
    }
    this.processBlock(inputL, inputR, outputL, outputR, numSamples, this.sampleRate);
  }

  private processBlock(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array,
    numSamples: number,
    sr: number
  ): void {
    const { parameters } = this;

    // FIXED: Clamp decay to prevent division by zero.
    // Feedback gain must scale with each line's loop time (RT60 definition):
    // gain_i = 0.001^(delayTime_i / decaySeconds), applied once per loop pass.
    // (A per-sample factor applied per pass gives a wildly wrong decay time.)
    const safeDecay = Math.max(MIN_DECAY, parameters.decay);
    const lineGains: number[] = new Array(FDN_SIZE);
    for (let i = 0; i < FDN_SIZE; i++) {
      const delaySec = this.delayLines[i].delaySamples / sr;
      lineGains[i] = Math.pow(0.001, delaySec / safeDecay);
    }

    const dryGain = parameters.dry / 100;
    const erGain = parameters.er / 100;
    const wetGain = parameters.wet / 100;
    const modAmount = parameters.modulation / 100;
    const width = parameters.stereoWidth / 100;
    const crosstalk = parameters.crosstalk / 100;
    const erAmount = parameters.earlyReflections / 100;
    const bassDamp = parameters.bassDamping / 100;
    const pdLen = this.preDelayBufL.length;
    const preDelaySamples = Math.min(pdLen - 1, Math.round((parameters.preDelay / 1000) * sr));

    for (let n = 0; n < numSamples; n++) {
      let inL = inputL[n] || 0;
      let inR = inputR[n] || 0;

      this.peakInputL = Math.max(this.peakInputL * 0.999, Math.abs(inL));
      this.peakInputR = Math.max(this.peakInputR * 0.999, Math.abs(inR));

      // Write current sample, then read preDelaySamples behind the write head.
      this.preDelayBufL[this.preDelayIdx] = inL;
      this.preDelayBufR[this.preDelayIdx] = inR;
      const readIdx = (this.preDelayIdx - preDelaySamples + pdLen) % pdLen;
      const delayedInL = this.preDelayBufL[readIdx];
      const delayedInR = this.preDelayBufR[readIdx];
      this.preDelayIdx = (this.preDelayIdx + 1) % pdLen;

      const monoIn = (delayedInL + delayedInR) * 0.5;
      const filteredIn = this.inputHPF.process(monoIn);

      const erL = this.earlyReflections.process(filteredIn, erAmount);
      const erR = erL * (1 - crosstalk * 0.3) + this.earlyReflections.process(filteredIn, erAmount * 0.7) * crosstalk * 0.3;

      const fdnInputs: number[] = new Array(FDN_SIZE).fill(0);
      for (let i = 0; i < FDN_SIZE; i++) {
        const pan = (i % 2 === 0) ? 1 : -1;
        fdnInputs[i] = filteredIn * 0.5 * (1 + pan * (width - 1) * 0.5);
      }

      const delayOutputs: number[] = [];
      for (let i = 0; i < FDN_SIZE; i++) {
        const line = this.delayLines[i];
        line.modPhase += this.modRate * (1 + i * 0.05);
        line.modDepth = (MOD_DEPTH_MS / 1000) * sr * modAmount * (1 + i * 0.1);

        let delayed = line.read();
        delayed = line.lpf.process(delayed);

        if (bassDamp > 0) {
          delayed *= (1 - bassDamp * 0.3);
        }

        delayOutputs.push(delayed);
      }

      const feedbackOutputs: number[] = new Array(FDN_SIZE).fill(0);
      for (let i = 0; i < FDN_SIZE; i++) {
        for (let j = 0; j < FDN_SIZE; j++) {
          feedbackOutputs[i] += this.hadamard[i][j] * delayOutputs[j];
        }
        feedbackOutputs[i] *= lineGains[i];
      }

      for (let i = 0; i < FDN_SIZE; i++) {
        const line = this.delayLines[i];
        const diffused = line.processDiffusion(fdnInputs[i] + feedbackOutputs[i]);
        line.write(diffused);
      }

      let wetL = 0, wetR = 0;
      for (let i = 0; i < FDN_SIZE; i++) {
        if (i % 2 === 0) wetL += delayOutputs[i];
        else wetR += delayOutputs[i];
      }
      wetL *= 0.25;
      wetR *= 0.25;

      wetL = this.outputLPF.process(wetL);
      wetR = this.outputLPF.process(wetR);
      wetL = this.outputHPF.process(wetL);
      wetR = this.outputHPF.process(wetR);

      if (this.isFrozen && this.freezeBufferL && this.freezeBufferR) {
        wetL = this.freezeBufferL[this.freezeIndex % this.freezeBufferL.length] || 0;
        wetR = this.freezeBufferR[this.freezeIndex % this.freezeBufferR.length] || 0;
        this.freezeIndex++;
      }

      outputL[n] = delayedInL * dryGain + erL * erGain + wetL * wetGain;
      outputR[n] = delayedInR * dryGain + erR * erGain + wetR * wetGain;

      this.peakOutputL = Math.max(this.peakOutputL * 0.999, Math.abs(outputL[n]));
      this.peakOutputR = Math.max(this.peakOutputR * 0.999, Math.abs(outputR[n]));
    }
  }

  private processOversampled(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array,
    numSamples: number
  ): void {
    const osNum = numSamples * 2;

    for (let i = 0; i < numSamples; i++) {
      this.oversampleBufferL[i * 2] = inputL[i] || 0;
      this.oversampleBufferL[i * 2 + 1] = inputL[i] || 0;
      this.oversampleBufferR[i * 2] = inputR[i] || 0;
      this.oversampleBufferR[i * 2 + 1] = inputR[i] || 0;
    }

    const osOutL = new Float32Array(osNum);
    const osOutR = new Float32Array(osNum);
    this.processBlock(this.oversampleBufferL, this.oversampleBufferR, osOutL, osOutR, osNum, this.sampleRate * 2);

    for (let i = 0; i < numSamples; i++) {
      outputL[i] = (osOutL[i * 2] + osOutL[i * 2 + 1]) * 0.5;
      outputR[i] = (osOutR[i * 2] + osOutR[i * 2 + 1]) * 0.5;
    }
  }

  getPeakLevels(): { inputL: number; inputR: number; outputL: number; outputR: number } {
    return {
      inputL: this.peakInputL,
      inputR: this.peakInputR,
      outputL: this.peakOutputL,
      outputR: this.peakOutputR,
    };
  }

  resetPeaks(): void {
    this.peakInputL = 0;
    this.peakInputR = 0;
    this.peakOutputL = 0;
    this.peakOutputR = 0;
  }

  clear(): void {
    for (const line of this.delayLines) line.clear();
    this.preDelayBufL.fill(0);
    this.preDelayBufR.fill(0);
    this.preDelayIdx = 0;
    this.earlyReflections.clear();
    this.inputHPF.clear();
    this.outputLPF.clear();
    this.outputHPF.clear();
    this.resetPeaks();
  }

  setSampleRate(sr: number): void {
    this.sampleRate = sr;
    this.modRate = (2 * Math.PI * MOD_LFO_RATE) / sr;
    this.updateDelayLengths();
    this.updateFilters();
    this.earlyReflections = new EarlyReflections(sr);
  }
}
