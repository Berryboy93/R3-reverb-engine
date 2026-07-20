/**
 * R3V4 Audio Engine — Web Audio API Integration
 * Manages AudioWorklet, parameter routing, input sources, and real-time metrics
 */

import { ReverbParameters, SpaceMode } from '../types/reverb';

export type InputSource = 'mic' | 'test-tone';

export class R3V4AudioEngine {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private oscillatorNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private pendingParams: Partial<ReverbParameters> = {};
  private onMetricsCallback: ((metrics: any) => void) | null = null;
  private onStateChangeCallback: ((state: AudioContextState) => void) | null = null;
  private inputSource: InputSource = 'test-tone';
  private currentStream: MediaStream | null = null;

  /**
   * Register a callback invoked whenever the AudioContext state changes.
   * Fires on both 'suspended' and 'running' transitions, so callers can
   * react to browsers that silently suspend a context post-initialization
   * (common in Firefox / older Safari under strict autoplay policies).
   */
  onStateChange(callback: (state: AudioContextState) => void): void {
    this.onStateChangeCallback = callback;
  }

  async initialize(inputSource: InputSource = 'test-tone'): Promise<boolean> {
    if (this.isInitialized) {
      await this.setInputSource(inputSource);
      await this.resume();
      return true;
    }

    try {
      this.inputSource = inputSource;
      this.audioContext = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });

      // Call resume() immediately — before any await — to consume the user-gesture
      // token while it is still valid.  Some browsers (Firefox, older Safari) report
      // state === 'running' right away yet still gate audio until an explicit resume()
      // inside a gesture handler; calling it first guarantees we are inside the gesture.
      await this.audioContext.resume();

      // Wire statechange so the UI can react to browsers that silently suspend
      // the context after initialization (e.g. tab is backgrounded, power-save mode).
      this.audioContext.addEventListener('statechange', () => {
        this.onStateChangeCallback?.(this.audioContext!.state);
      });

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

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.workletNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      await this.connectSource(inputSource);

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

  private async connectSource(source: InputSource): Promise<void> {
    if (!this.audioContext || !this.workletNode) return;

    // Disconnect any existing source
    this.sourceNode?.disconnect();
    this.oscillatorNode?.stop();
    this.oscillatorNode?.disconnect();
    this.gainNode?.disconnect();
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
      this.currentStream = null;
    }

    if (source === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        this.currentStream = stream;
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.sourceNode.connect(this.workletNode);
      } catch (err) {
        console.warn('Microphone access failed, falling back to test tone:', err);
        this.inputSource = 'test-tone';
        this.connectTone();
      }
    } else {
      this.connectTone();
    }
  }

  private connectTone(): void {
    if (!this.audioContext || !this.workletNode) return;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.15;

    this.oscillatorNode = this.audioContext.createOscillator();
    this.oscillatorNode.type = 'sawtooth';
    this.oscillatorNode.frequency.value = 110; // A2
    this.oscillatorNode.connect(this.gainNode);
    this.gainNode.connect(this.workletNode);
    this.oscillatorNode.start();
  }

  async setInputSource(source: InputSource): Promise<void> {
    if (this.inputSource === source && this.isRunning) return;
    this.inputSource = source;
    if (this.isInitialized) {
      await this.connectSource(source);
    }
  }

  getInputSource(): InputSource {
    return this.inputSource;
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

  setSpaceMode(_mode: SpaceMode): void {
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

  suspend(): Promise<void> { return this.audioContext?.suspend() ?? Promise.resolve(); }
  resume(): Promise<void> { return this.audioContext?.resume() ?? Promise.resolve(); }

  async toggle(): Promise<void> {
    if (this.isRunning) await this.suspend();
    else await this.resume();
  }

  getContextState(): AudioContextState | null {
    return this.audioContext?.state ?? null;
  }

  close(): void {
    this.sourceNode?.disconnect();
    this.oscillatorNode?.stop();
    this.oscillatorNode?.disconnect();
    this.gainNode?.disconnect();
    this.workletNode?.disconnect();
    this.analyser?.disconnect();
    this.currentStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.isInitialized = false;
  }

  get isRunning(): boolean {
    return this.audioContext?.state === 'running';
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

