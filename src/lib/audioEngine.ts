/**
 * R3V4 Audio Engine — Web Audio API Integration
 * Manages AudioWorklet, parameter routing, and real-time metrics
 */

import { ReverbParameters, SpaceMode } from '../types/reverb';

export class R3V4AudioEngine {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private pendingParams: Partial<ReverbParameters> = {};
  private onMetricsCallback: ((metrics: any) => void) | null = null;

  async initialize(stream?: MediaStream): Promise<boolean> {
    try {
      this.audioContext = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });

      const processorCode = await fetch('/r3v4-processor.js').then(r => r.text());
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      this.workletNode = new AudioWorkletNode(this.audioContext, 'r3v4-reverb-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        outputChannelCount: [2],
        parameterData: {},
      });

      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'metrics' && this.onMetricsCallback) {
          this.onMetricsCallback(event.data.data);
        }
      };

      if (stream) {
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.sourceNode.connect(this.workletNode);
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.workletNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      if (Object.keys(this.pendingParams).length > 0) {
        this.setParameters(this.pendingParams);
        this.pendingParams = {};
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('R3V4 Audio Engine init failed:', err);
      return false;
    }
  }

  setParameters(params: Partial<ReverbParameters>): void {
    if (!this.isInitialized || !this.workletNode) {
      this.pendingParams = { ...this.pendingParams, ...params };
      return;
    }
    this.workletNode.port.postMessage({ type: 'setParams', data: params });

    Object.entries(params).forEach(([key, value]) => {
      const param = this.workletNode!.parameters.get(key);
      if (param && typeof value === 'number') {
        param.setValueAtTime(value, this.audioContext!.currentTime);
      }
    });
  }

  setSpaceMode(mode: SpaceMode): void {
    this.setParameters({} as any);
  }

  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  onMetrics(callback: (metrics: any) => void): void {
    this.onMetricsCallback = callback;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 48000;
  }

  suspend(): void { this.audioContext?.suspend(); }
  resume(): void { this.audioContext?.resume(); }

  close(): void {
    this.sourceNode?.disconnect();
    this.workletNode?.disconnect();
    this.analyser?.disconnect();
    this.audioContext?.close();
    this.isInitialized = false;
  }

  get isRunning(): boolean {
    return this.audioContext?.state === 'running';
  }
}
