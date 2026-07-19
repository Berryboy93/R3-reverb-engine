/**
 * R3V4 Reverb Engine — Factory Presets Library
 * 15 presets: 1 Init + 14 production categories
 */

import { Preset, SpaceMode } from '../types/reverb';

export const FACTORY_PRESETS: Preset[] = [
  {
    name: 'Init — Clean Slate',
    category: 'Default',
    description: 'Neutral starting point for custom design',
    spaceMode: 'Hall',
    parameters: {
      preDelay: 45, decay: 2.5, size: 65, diffusion: 78, damping: 42,
      highCut: 12000, lowCut: 120, bassDamping: 35, stereoWidth: 100,
      earlyReflections: 60, crosstalk: 50, dry: 80, er: 40, wet: 25,
      modulation: 15, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Drums — Tight Room',
    category: 'Drums',
    description: 'Short, punchy room ambience for drum kits',
    spaceMode: 'Room',
    parameters: {
      preDelay: 15, decay: 0.8, size: 25, diffusion: 45, damping: 30,
      highCut: 8000, lowCut: 200, bassDamping: 60, stereoWidth: 80,
      earlyReflections: 70, crosstalk: 40, dry: 90, er: 30, wet: 15,
      modulation: 5, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Vocals — Cathedral Halo',
    category: 'Vocals',
    description: 'Lush, expansive space for lead and backing vocals',
    spaceMode: 'Cathedral',
    parameters: {
      preDelay: 80, decay: 5.5, size: 85, diffusion: 90, damping: 55,
      highCut: 14000, lowCut: 80, bassDamping: 25, stereoWidth: 140,
      earlyReflections: 50, crosstalk: 60, dry: 70, er: 35, wet: 40,
      modulation: 25, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Piano — Concert Hall',
    category: 'Piano',
    description: 'Natural concert hall response for grand piano',
    spaceMode: 'Hall',
    parameters: {
      preDelay: 35, decay: 3.2, size: 75, diffusion: 82, damping: 40,
      highCut: 16000, lowCut: 60, bassDamping: 30, stereoWidth: 110,
      earlyReflections: 65, crosstalk: 55, dry: 75, er: 40, wet: 30,
      modulation: 10, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Synth — Infinite Pad',
    category: 'Synth',
    description: 'Endless, evolving ambient space for synthesizers',
    spaceMode: 'Infinite',
    parameters: {
      preDelay: 60, decay: 20, size: 95, diffusion: 95, damping: 50,
      highCut: 10000, lowCut: 40, bassDamping: 20, stereoWidth: 180,
      earlyReflections: 45, crosstalk: 70, dry: 50, er: 30, wet: 70,
      modulation: 40, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Strings — Chamber Warmth',
    category: 'Strings',
    description: 'Intimate chamber ensemble warmth',
    spaceMode: 'Chamber',
    parameters: {
      preDelay: 25, decay: 2.8, size: 55, diffusion: 75, damping: 60,
      highCut: 12000, lowCut: 80, bassDamping: 35, stereoWidth: 90,
      earlyReflections: 55, crosstalk: 45, dry: 80, er: 35, wet: 25,
      modulation: 12, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Podcast — Voice Clarity',
    category: 'Podcast',
    description: 'Transparent space that enhances without coloring',
    spaceMode: 'Studio',
    parameters: {
      preDelay: 20, decay: 1.2, size: 30, diffusion: 55, damping: 35,
      highCut: 10000, lowCut: 150, bassDamping: 50, stereoWidth: 70,
      earlyReflections: 40, crosstalk: 30, dry: 95, er: 20, wet: 10,
      modulation: 0, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Voiceover — Broadcast Room',
    category: 'Voiceover',
    description: 'Controlled broadcast studio ambience',
    spaceMode: 'Studio',
    parameters: {
      preDelay: 15, decay: 0.9, size: 28, diffusion: 50, damping: 32,
      highCut: 9500, lowCut: 180, bassDamping: 55, stereoWidth: 65,
      earlyReflections: 35, crosstalk: 25, dry: 92, er: 18, wet: 12,
      modulation: 0, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'EDM — Arena Impact',
    category: 'EDM',
    description: 'Massive arena-sized impact for electronic drops',
    spaceMode: 'Arena',
    parameters: {
      preDelay: 10, decay: 4.0, size: 90, diffusion: 85, damping: 25,
      highCut: 18000, lowCut: 100, bassDamping: 40, stereoWidth: 150,
      earlyReflections: 80, crosstalk: 65, dry: 85, er: 50, wet: 35,
      modulation: 20, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Hip Hop — Tight Plate',
    category: 'Hip Hop',
    description: 'Classic plate reverb character for hip hop vocals',
    spaceMode: 'Plate',
    parameters: {
      preDelay: 18, decay: 1.5, size: 35, diffusion: 70, damping: 30,
      highCut: 9000, lowCut: 180, bassDamping: 55, stereoWidth: 85,
      earlyReflections: 75, crosstalk: 35, dry: 88, er: 35, wet: 18,
      modulation: 8, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Lo-Fi — Vintage Spring',
    category: 'Lo-Fi',
    description: 'Warm, wobbly spring reverb with character',
    spaceMode: 'Spring',
    parameters: {
      preDelay: 30, decay: 1.8, size: 20, diffusion: 40, damping: 70,
      highCut: 6000, lowCut: 120, bassDamping: 45, stereoWidth: 60,
      earlyReflections: 85, crosstalk: 25, dry: 75, er: 45, wet: 30,
      modulation: 30, freeze: false, ducking: false, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Ambient — Deep Space',
    category: 'Ambient',
    description: 'Infinite, evolving deep space textures',
    spaceMode: 'Ambient',
    parameters: {
      preDelay: 100, decay: 25, size: 100, diffusion: 95, damping: 45,
      highCut: 8000, lowCut: 30, bassDamping: 15, stereoWidth: 200,
      earlyReflections: 30, crosstalk: 80, dry: 40, er: 25, wet: 80,
      modulation: 50, freeze: false, ducking: false, tempoSync: true, oversampling: true,
    }
  },
  {
    name: 'Cinematic — Epic Hall',
    category: 'Cinematic',
    description: 'Grand orchestral hall for film scoring',
    spaceMode: 'Hall',
    parameters: {
      preDelay: 55, decay: 6.0, size: 88, diffusion: 88, damping: 50,
      highCut: 15000, lowCut: 50, bassDamping: 25, stereoWidth: 130,
      earlyReflections: 60, crosstalk: 55, dry: 65, er: 40, wet: 50,
      modulation: 15, freeze: false, ducking: false, tempoSync: true, oversampling: true,
    }
  },
  {
    name: 'Live — Stage Presence',
    category: 'Live',
    description: 'Natural stage ambience for live recordings',
    spaceMode: 'Hall',
    parameters: {
      preDelay: 12, decay: 1.8, size: 50, diffusion: 60, damping: 35,
      highCut: 12000, lowCut: 100, bassDamping: 40, stereoWidth: 100,
      earlyReflections: 70, crosstalk: 50, dry: 85, er: 40, wet: 22,
      modulation: 10, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
  {
    name: 'Master Bus — Glue & Space',
    category: 'Master Bus',
    description: 'Subtle cohesion reverb for final mix bus',
    spaceMode: 'Hall',
    parameters: {
      preDelay: 25, decay: 2.0, size: 45, diffusion: 65, damping: 45,
      highCut: 11000, lowCut: 100, bassDamping: 50, stereoWidth: 95,
      earlyReflections: 50, crosstalk: 45, dry: 90, er: 25, wet: 12,
      modulation: 8, freeze: false, ducking: true, tempoSync: true, oversampling: false,
    }
  },
];

export function getPresetByName(name: string): Preset | undefined {
  return FACTORY_PRESETS.find(p => p.name === name);
}

export function getPresetsByCategory(category: string): Preset[] {
  return FACTORY_PRESETS.filter(p => p.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(FACTORY_PRESETS.map(p => p.category))];
}
