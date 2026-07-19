/**
 * R3V4 Reverb Engine — Core Type Definitions
 * Production Specification v1.0
 */

// ─── Brand Colors ───────────────────────────────────────────────────────────
export const R3V4_COLORS = {
  neonNativeGreen: '#B7FF00' as const,
  midnightBlack: '#080808' as const,
  titaniumSilver: '#E6E6E6' as const,
  graphite: '#242424' as const,
  darkGraphite: '#1a1a1a' as const,
  panelBg: '#0c0c0c' as const,
  border: '#333333' as const,
  textMuted: '#666666' as const,
  textSecondary: '#888888' as const,
  danger: '#FF4444' as const,
  warning: '#FFD700' as const,
} as const;

// ─── Space Modes ────────────────────────────────────────────────────────────
export type SpaceMode =
  | 'Hall'
  | 'Room'
  | 'Plate'
  | 'Spring'
  | 'Cathedral'
  | 'Arena'
  | 'Studio'
  | 'Chamber'
  | 'Ambient'
  | 'Infinite';

export const SPACE_MODES: SpaceMode[] = [
  'Hall', 'Room', 'Plate', 'Spring', 'Cathedral',
  'Arena', 'Studio', 'Chamber', 'Ambient', 'Infinite'
];

// ─── Reverb Parameters ──────────────────────────────────────────────────────
export interface ReverbParameters {
  preDelay: number;
  decay: number;
  size: number;
  diffusion: number;
  damping: number;
  highCut: number;
  lowCut: number;
  bassDamping: number;
  stereoWidth: number;
  earlyReflections: number;
  crosstalk: number;
  dry: number;
  er: number;
  wet: number;
  modulation: number;
  freeze: boolean;
  ducking: boolean;
  tempoSync: boolean;
  oversampling: boolean;
}

export const DEFAULT_PARAMETERS: ReverbParameters = {
  preDelay: 45,
  decay: 2.5,
  size: 65,
  diffusion: 78,
  damping: 42,
  highCut: 12000,
  lowCut: 120,
  bassDamping: 35,
  stereoWidth: 100,
  earlyReflections: 60,
  crosstalk: 50,
  modulation: 15,
  dry: 80,
  er: 40,
  wet: 25,
  freeze: false,
  ducking: false,
  tempoSync: true,
  oversampling: false,
};

// ─── Parameter Ranges ───────────────────────────────────────────────────────
export interface ParameterRange {
  min: number;
  max: number;
  step: number;
  unit: string;
  displayFormat: (v: number) => string;
}

export const PARAMETER_RANGES: Record<string, ParameterRange> = {
  preDelay:        { min: 0,    max: 500,   step: 1,   unit: 'ms', displayFormat: v => `${Math.round(v)}` },
  decay:           { min: 0.1,  max: 30,    step: 0.1, unit: 's',  displayFormat: v => v.toFixed(1) },
  size:            { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  diffusion:       { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  damping:         { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  highCut:         { min: 1000, max: 20000, step: 100, unit: 'Hz', displayFormat: v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}` },
  lowCut:          { min: 20,   max: 1000,  step: 10,  unit: 'Hz', displayFormat: v => `${Math.round(v)}` },
  bassDamping:     { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  stereoWidth:     { min: 0,    max: 200,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  earlyReflections:{ min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  crosstalk:       { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  modulation:      { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  dry:             { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  er:              { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
  wet:             { min: 0,    max: 100,   step: 1,   unit: '%',  displayFormat: v => `${Math.round(v)}` },
};

// ─── Presets ────────────────────────────────────────────────────────────────
export interface Preset {
  name: string;
  category: string;
  description: string;
  parameters: ReverbParameters;
  spaceMode: SpaceMode;
}

export const PRESET_CATEGORIES = [
  'Drums', 'Vocals', 'Piano', 'Synth', 'Strings',
  'Podcast', 'Voiceover', 'EDM', 'Hip Hop', 'Lo-Fi',
  'Ambient', 'Cinematic', 'Live', 'Master Bus'
] as const;

export type PresetCategory = typeof PRESET_CATEGORIES[number];

// ─── Plugin State ───────────────────────────────────────────────────────────
export interface PluginState {
  parameters: ReverbParameters;
  spaceMode: SpaceMode;
  presetName: string;
  isBypassed: boolean;
  isProcessing: boolean;
  cpuUsage: number;
  latency: number;
  sampleRate: number;
  oversamplingFactor: number;
  inputLevel: number;
  outputLevel: number;
}

// ─── DSP Engine State ───────────────────────────────────────────────────────
export interface DSPState {
  sampleRate: number;
  bufferSize: number;
  numChannels: number;
  isProcessing: boolean;
  peakInputL: number;
  peakInputR: number;
  peakOutputL: number;
  peakOutputR: number;
  cpuLoad: number;
}

// ─── Platform Targets ─────────────────────────────────────────────────────────
export type PlatformTarget = 'standalone' | 'vst3' | 'au' | 'aax' | 'web';

// ─── UI Component Props ─────────────────────────────────────────────────────
export interface KnobProps {
  param: keyof ReverbParameters;
  value: number;
  onChange: (value: number) => void;
  label: string;
  tooltip?: string;
}

export interface FaderProps {
  param: 'dry' | 'er' | 'wet';
  value: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
}

export interface MeterProps {
  level: number;
  peak?: number;
  label: string;
  orientation?: 'horizontal' | 'vertical';
}

// ─── Audio Engine Events ────────────────────────────────────────────────────
export type AudioEngineEvent =
  | { type: 'parameterChange'; param: keyof ReverbParameters; value: number }
  | { type: 'spaceModeChange'; mode: SpaceMode }
  | { type: 'presetLoad'; preset: Preset }
  | { type: 'bypassToggle'; bypassed: boolean }
  | { type: 'process'; inputL: Float32Array; inputR: Float32Array; outputL: Float32Array; outputR: Float32Array };
