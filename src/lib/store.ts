/**
 * R3V4 Reverb Engine — Global State Management (Zustand)
 * Handles parameter state, undo/redo, A/B compare, preset management
 */

import { create } from 'zustand';
import { ReverbParameters, SpaceMode, Preset, DEFAULT_PARAMETERS } from '../types/reverb';
import { FACTORY_PRESETS, getPresetByName } from './presets';

interface HistoryEntry {
  parameters: ReverbParameters;
  spaceMode: SpaceMode;
  presetName: string;
}

interface R3V4Store {
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
  stateA: HistoryEntry | null;
  stateB: HistoryEntry | null;
  activeAB: 'A' | 'B';
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;
  userPresets: Preset[];
  setParameter: (param: keyof ReverbParameters, value: number | boolean) => void;
  setSpaceMode: (mode: SpaceMode) => void;
  loadPreset: (preset: Preset) => void;
  loadPresetByName: (name: string) => void;
  loadFirstPresetByCategory: (category: string) => void;
  nextPreset: () => void;
  previousPreset: () => void;
  saveUserPreset: (name: string, category: string) => void;
  deleteUserPreset: (name: string) => void;
  toggleBypass: () => void;
  togglePower: () => void;
  undo: () => void;
  redo: () => void;
  captureStateA: () => void;
  captureStateB: () => void;
  switchAB: () => void;
  randomize: () => void;
  reset: () => void;
  setMetrics: (metrics: Partial<Pick<R3V4Store, 'cpuUsage' | 'latency' | 'inputLevel' | 'outputLevel'>>) => void;
  setSampleRate: (sr: number) => void;
  setProcessing: (value: boolean) => void;
}

const MAX_HISTORY = 50;

// Coalesce rapid successive edits to the SAME parameter (e.g. a knob drag)
// into a single history entry, so undo steps between meaningful gestures
// instead of replaying every intermediate drag value — and so a drag doesn't
// allocate dozens of parameter-object snapshots per second.
const HISTORY_COALESCE_MS = 800;
let lastEditedParam: string | null = null;
let lastEditTime = 0;

function createHistoryEntry(state: Pick<R3V4Store, 'parameters' | 'spaceMode' | 'presetName'>): HistoryEntry {
  return {
    parameters: { ...state.parameters },
    spaceMode: state.spaceMode,
    presetName: state.presetName,
  };
}

export const useR3V4Store = create<R3V4Store>((set, get) => ({
  parameters: { ...DEFAULT_PARAMETERS },
  spaceMode: 'Hall',
  presetName: 'Init — Clean Slate',
  isBypassed: false,
  // Default FALSE (intentional): audio can't start without a user gesture,
  // so the UI loads dimmed (42% opacity) with the unlock banner guiding the
  // user. setProcessing(true) fires once audio actually runs. Do not change
  // to true — a bright "active" UI over silent audio misrepresents state.
  isProcessing: false,
  cpuUsage: 0,
  latency: 2.1,
  sampleRate: 48000,
  oversamplingFactor: 1,
  inputLevel: 0,
  outputLevel: 0,
  stateA: null,
  stateB: null,
  activeAB: 'A',
  history: [createHistoryEntry({ parameters: DEFAULT_PARAMETERS, spaceMode: 'Hall', presetName: 'Init — Clean Slate' })],
  historyIndex: 0,
  maxHistory: MAX_HISTORY,
  userPresets: [],

  setParameter: (param, value) => {
    const state = get();
    const newParams = { ...state.parameters, [param]: value };
    const newEntry = createHistoryEntry({ parameters: newParams, spaceMode: state.spaceMode, presetName: state.presetName });
    const now = Date.now();
    const coalesce =
      lastEditedParam === param &&
      now - lastEditTime < HISTORY_COALESCE_MS &&
      state.historyIndex === state.history.length - 1 &&
      state.history.length > 1;
    lastEditedParam = param;
    lastEditTime = now;

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    if (coalesce) {
      newHistory[newHistory.length - 1] = newEntry; // replace in-flight drag entry
    } else {
      newHistory.push(newEntry);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
    }
    set({ parameters: newParams, presetName: 'Custom', history: newHistory, historyIndex: newHistory.length - 1 });
  },

  setSpaceMode: (mode) => {
    const state = get();
    const newEntry = createHistoryEntry({ parameters: state.parameters, spaceMode: mode, presetName: state.presetName });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ spaceMode: mode, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  loadPreset: (preset) => {
    const newEntry = createHistoryEntry({ parameters: preset.parameters, spaceMode: preset.spaceMode, presetName: preset.name });
    const newHistory = get().history.slice(0, get().historyIndex + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ parameters: { ...preset.parameters }, spaceMode: preset.spaceMode, presetName: preset.name, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  loadPresetByName: (name) => {
    const preset = getPresetByName(name);
    if (preset) get().loadPreset(preset);
  },

  loadFirstPresetByCategory: (category) => {
    const preset = FACTORY_PRESETS.find(p => p.category === category);
    if (preset) get().loadPreset(preset);
  },

  nextPreset: () => {
    const state = get();
    const all = FACTORY_PRESETS;
    const idx = all.findIndex(p => p.name === state.presetName);
    const next = all[(idx + 1) % all.length];
    state.loadPreset(next);
  },

  previousPreset: () => {
    const state = get();
    const all = FACTORY_PRESETS;
    const idx = all.findIndex(p => p.name === state.presetName);
    const prev = all[(idx - 1 + all.length) % all.length];
    state.loadPreset(prev);
  },

  saveUserPreset: (name, category) => {
    const state = get();
    const newPreset: Preset = {
      name, category,
      description: `User preset: ${name}`,
      parameters: { ...state.parameters },
      spaceMode: state.spaceMode,
    };
    set({ userPresets: [...state.userPresets.filter(p => p.name !== name), newPreset] });
  },

  deleteUserPreset: (name) => {
    set({ userPresets: get().userPresets.filter(p => p.name !== name) });
  },

  toggleBypass: () => set({ isBypassed: !get().isBypassed }),
  togglePower: () => set({ isProcessing: !get().isProcessing }),

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const idx = state.historyIndex - 1;
      const entry = state.history[idx];
      set({ parameters: { ...entry.parameters }, spaceMode: entry.spaceMode, presetName: entry.presetName, historyIndex: idx });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const idx = state.historyIndex + 1;
      const entry = state.history[idx];
      set({ parameters: { ...entry.parameters }, spaceMode: entry.spaceMode, presetName: entry.presetName, historyIndex: idx });
    }
  },

  captureStateA: () => {
    const state = get();
    set({ stateA: createHistoryEntry(state), activeAB: 'A' });
  },

  captureStateB: () => {
    const state = get();
    set({ stateB: createHistoryEntry(state), activeAB: 'B' });
  },

  switchAB: () => {
    const state = get();
    const target = state.activeAB === 'A' ? 'B' : 'A';
    const entry = target === 'A' ? state.stateA : state.stateB;
    if (entry) {
      set({ parameters: { ...entry.parameters }, spaceMode: entry.spaceMode, presetName: entry.presetName, activeAB: target });
    }
  },

  randomize: () => {
    const state = get();
    const randomParams: Partial<ReverbParameters> = {
      preDelay: Math.random() * 500,
      decay: 0.1 + Math.random() * 29.9,
      size: Math.random() * 100,
      diffusion: Math.random() * 100,
      damping: Math.random() * 100,
      highCut: 1000 + Math.random() * 19000,
      lowCut: 20 + Math.random() * 980,
      bassDamping: Math.random() * 100,
      stereoWidth: Math.random() * 200,
      earlyReflections: Math.random() * 100,
      crosstalk: Math.random() * 100,
      modulation: Math.random() * 100,
      dry: 50 + Math.random() * 50,
      er: Math.random() * 60,
      wet: Math.random() * 70,
    };
    const newParams = { ...state.parameters, ...randomParams };
    const newEntry = createHistoryEntry({ parameters: newParams, spaceMode: state.spaceMode, presetName: 'Random' });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ parameters: newParams, presetName: 'Random', history: newHistory, historyIndex: newHistory.length - 1 });
  },

  reset: () => {
    const entry = createHistoryEntry({ parameters: DEFAULT_PARAMETERS, spaceMode: 'Hall', presetName: 'Init — Clean Slate' });
    const newHistory = get().history.slice(0, get().historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ parameters: { ...DEFAULT_PARAMETERS }, spaceMode: 'Hall', presetName: 'Init — Clean Slate', history: newHistory, historyIndex: newHistory.length - 1 });
  },

  setMetrics: (metrics) => set(metrics),
  setSampleRate: (sr) => set({ sampleRate: sr }),
  setProcessing: (value) => set({ isProcessing: value }),
}));
