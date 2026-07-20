/**
 * R3V4 Reverb Engine — AudioWorklet Processor
 * FIXED: super() call, Date.now() instead of performance.now(),
 *        boolean params removed from AudioParam descriptors (use message port)
 */

import { FDNReverbEngine } from './FDNReverb';

// @ts-ignore
declare const AudioWorkletProcessor: any;
// @ts-ignore
declare const registerProcessor: any;

// AudioWorklet only supports numeric parameters — booleans handled via message port
const PARAM_DESCRIPTORS = [
  { name: 'preDelay', defaultValue: 45, minValue: 0, maxValue: 500 },
  { name: 'decay', defaultValue: 2.5, minValue: 0.1, maxValue: 30 },
  { name: 'size', defaultValue: 65, minValue: 0, maxValue: 100 },
  { name: 'diffusion', defaultValue: 78, minValue: 0, maxValue: 100 },
  { name: 'damping', defaultValue: 42, minValue: 0, maxValue: 100 },
  { name: 'highCut', defaultValue: 12000, minValue: 1000, maxValue: 20000 },
  { name: 'lowCut', defaultValue: 120, minValue: 20, maxValue: 1000 },
  { name: 'bassDamping', defaultValue: 35, minValue: 0, maxValue: 100 },
  { name: 'stereoWidth', defaultValue: 100, minValue: 0, maxValue: 200 },
  { name: 'earlyReflections', defaultValue: 60, minValue: 0, maxValue: 100 },
  { name: 'crosstalk', defaultValue: 50, minValue: 0, maxValue: 100 },
  { name: 'modulation', defaultValue: 15, minValue: 0, maxValue: 100 },
  { name: 'dry', defaultValue: 80, minValue: 0, maxValue: 100 },
  { name: 'er', defaultValue: 40, minValue: 0, maxValue: 100 },
  { name: 'wet', defaultValue: 25, minValue: 0, maxValue: 100 },
];

class R3V4Processor extends AudioWorkletProcessor {
  private engine: FDNReverbEngine;
  private sampleRate: number;
  private currentParams: Record<string, number | boolean>;
  private paramChanged = false;
  private blockCount = 0;
  private cpuStart = 0;

  static get parameterDescriptors() {
    return PARAM_DESCRIPTORS;
  }

  constructor() {
    super(); // FIXED: Added missing super() call
    this.sampleRate = 48000;
    this.currentParams = {
      preDelay: 45, decay: 2.5, size: 65, diffusion: 78, damping: 42,
      highCut: 12000, lowCut: 120, bassDamping: 35, stereoWidth: 100,
      earlyReflections: 60, crosstalk: 50, dry: 80, er: 40, wet: 25,
      modulation: 15, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    };
    this.engine = new FDNReverbEngine(this.sampleRate, 2048);

    this.port.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      switch (type) {
        case 'setParams':
          this.currentParams = { ...this.currentParams, ...data };
          this.paramChanged = true;
          break;
        case 'clear':
          this.engine.clear();
          break;
        case 'setSampleRate':
          this.sampleRate = data;
          this.engine.setSampleRate(data);
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 1 || output.length < 2) {
      return true;
    }

    // Mono input: feed the single channel into both sides of the stereo engine
    // rather than silently bypassing (some browsers deliver mic input as mono).
    const inL = input[0];
    const inR = input.length >= 2 ? input[1] : input[0];

    const numSamples = input[0].length;
    if (numSamples === 0) return true;

    if (this.paramChanged) {
      this.engine.setParameters(this.currentParams as any);
      this.paramChanged = false;
    }

    // Check AudioParam automations (numeric only)
    const params: Record<string, number> = {};
    let hasAuto = false;
    for (const desc of PARAM_DESCRIPTORS) {
      const arr = parameters[desc.name];
      if (arr && arr.length > 0) {
        const val = arr.length > 1 ? arr[numSamples - 1] : arr[0];
        if (Math.abs(val - (this.currentParams[desc.name] as number)) > 0.001) {
          params[desc.name] = val;
          hasAuto = true;
        }
      }
    }
    if (hasAuto) {
      this.currentParams = { ...this.currentParams, ...params };
      this.engine.setParameters(params as any);
    }

    // FIXED: Use Date.now() — performance.now() is NOT available in AudioWorkletGlobalScope
    this.cpuStart = Date.now();

    this.engine.process(inL, inR, output[0], output[1], numSamples);

    this.blockCount++;
    if (this.blockCount >= 10) {
      const elapsed = Date.now() - this.cpuStart;
      const avgCpu = (elapsed) / (numSamples / this.sampleRate * 1000) * 100;
      const peaks = this.engine.getPeakLevels();
      this.port.postMessage({
        type: 'metrics',
        data: {
          cpuLoad: Math.min(avgCpu, 100),
          peakInputL: peaks.inputL,
          peakInputR: peaks.inputR,
          peakOutputL: peaks.outputL,
          peakOutputR: peaks.outputR,
        }
      });
      this.blockCount = 0;
    }

    return true;
  }
}

registerProcessor('r3v4-reverb-processor', R3V4Processor);
