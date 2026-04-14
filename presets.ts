import { LutSettings, DEFAULT_SETTINGS } from './types';

export interface Preset {
  id: string;
  name: string;
  description: string;
  gradient: string; // CSS gradient for the card thumbnail
  settings: LutSettings;
}

export const PRESETS: Preset[] = [
  // ── LIFESTYLE ────────────────────────────────────────────────────────────────

  {
    id: 'bright-airy',
    name: 'Bright & Airy',
    description: 'Dreamy, overexposed look with soft shadows — classic wedding & portrait style.',
    gradient: 'linear-gradient(135deg, #fff5ee 0%, #ffe8d6 50%, #ffffff 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.50,
      contrast: 0.82,
      temperature: 0.12,
      saturation: 0.88,
      vibrance: 0.10,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.12 },
        shadows:    { r: 0.02, g: 0.01, b: 0,    l: 0.10 },
        midtones:   { r: 0,    g: 0,    b: 0,    l: 0.02 },
        highlights: { r: 0.02, g: 0.01, b: 0,    l: 0.06 },
      },
    },
  },

  {
    id: 'warm-mellow',
    name: 'Warm & Mellow',
    description: 'Gentle warmth with lifted blacks and a faint amber cast. Great for everyday lifestyle.',
    gradient: 'linear-gradient(135deg, #6b3a1f 0%, #c4804a 50%, #f5d5a8 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.15,
      offset: 0.04,
      contrast: 0.88,
      temperature: 0.30,
      tint: 0.08,
      saturation: 0.92,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.12, g: 0.05, b: -0.06, l: 0.03 },
        midtones:   { r: 0.04, g: 0.01, b: -0.02, l: 0    },
        highlights: { r: 0.06, g: 0.03, b: -0.04, l: 0    },
      },
    },
  },

  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Replicates the magic of late-afternoon sun: rich amber tones with glowing highlights.',
    gradient: 'linear-gradient(135deg, #7b3800 0%, #e87000 45%, #ffd060 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.15,
      contrast: 1.10,
      temperature: 0.45,
      tint: 0.10,
      saturation: 1.10,
      vibrance: 0.15,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.08, g: 0.03, b: -0.04, l: 0 },
        midtones:   { r: 0.04, g: 0.01, b: -0.02, l: 0 },
        highlights: { r: 0.10, g: 0.05, b: -0.06, l: 0 },
      },
    },
  },

  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    description: 'Muted, pastel-tinted tones with gentle contrast. Flattering and versatile.',
    gradient: 'linear-gradient(135deg, #f0d6e8 0%, #d6e8f0 50%, #e8f0d6 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      offset: 0.06,
      contrast: 0.80,
      temperature: 0.08,
      saturation: 0.80,
      vibrance: 0.20,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.06, g: 0.04, b: 0.04, l: 0.05 },
        midtones:   { r: 0.01, g: 0.01, b: 0.01, l: 0    },
        highlights: { r: 0,    g: 0.01, b: 0.02, l: 0.02 },
      },
    },
  },

  // ── CINEMATIC ────────────────────────────────────────────────────────────────

  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    description: 'The Hollywood blockbuster grade: cool teal shadows vs. warm skin tones.',
    gradient: 'linear-gradient(135deg, #004d4d 0%, #111111 50%, #b03000 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      contrast: 1.20,
      saturation: 1.10,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.12 },
        shadows:    { r: -0.12, g: 0.02,  b: 0.18,  l: 0 },
        midtones:   { r:  0.02, g: 0,     b: -0.02, l: 0 },
        highlights: { r:  0.14, g: 0.05,  b: -0.10, l: 0 },
      },
    },
  },

  {
    id: 'moody-dark',
    name: 'Moody Dark',
    description: 'Deep, dramatic grade with crushed blacks and cool shadows. High-impact cinematic.',
    gradient: 'linear-gradient(135deg, #06060f 0%, #151528 50%, #2e1e10 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: -0.30,
      contrast: 1.35,
      saturation: 0.85,
      temperature: -0.10,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: -0.08, g: 0,    b: 0.15,  l: -0.05 },
        midtones:   { r: -0.02, g: 0,    b: 0.04,  l:  0    },
        highlights: { r:  0.08, g: 0.04, b: -0.04, l:  0    },
      },
    },
  },

  {
    id: 'cool-crisp',
    name: 'Cool & Crisp',
    description: 'Sharp, modern look with cool-blue tones and punchy contrast.',
    gradient: 'linear-gradient(135deg, #0f2744 0%, #2e6cbf 50%, #ddeeff 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      contrast: 1.25,
      temperature: -0.25,
      tint: -0.05,
      saturation: 1.05,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: -0.05, g: 0, b: 0.08, l:  0 },
        midtones:   { r:  0,    g: 0, b: 0,    l:  0 },
        highlights: { r:  0,    g: 0, b: 0.02, l:  0 },
      },
    },
  },

  {
    id: 'faded-matte',
    name: 'Faded Matte',
    description: 'Lifted blacks, low contrast, muted palette. The classic Instagram matte look.',
    gradient: 'linear-gradient(135deg, #7a6e64 0%, #b8aea4 50%, #ddd4cb 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      offset: 0.08,
      contrast: 0.78,
      saturation: 0.82,
      temperature: 0.12,
      vibrance: -0.10,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.04, g: 0.02, b: 0,     l: 0 },
        midtones:   { r: 0,    g: 0,    b: 0,     l: 0 },
        highlights: { r: 0,    g: 0,    b: -0.02, l: 0 },
      },
    },
  },

  // ── FILM & VINTAGE ───────────────────────────────────────────────────────────

  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Faded, warm retro look with sepia-tinted shadows and muted palette.',
    gradient: 'linear-gradient(135deg, #4a2c0a 0%, #9e7040 50%, #d4b896 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.05,
      offset: 0.05,
      contrast: 0.88,
      temperature: 0.20,
      tint: 0.06,
      saturation: 0.78,
      vibrance: -0.05,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.12, g: 0.06, b: -0.06, l: 0    },
        midtones:   { r: 0.03, g: 0.01, b: -0.02, l: 0    },
        highlights: { r: 0.04, g: 0.02, b: -0.02, l: 0    },
      },
    },
  },

  {
    id: 'clean-bright',
    name: 'Clean & Bright',
    description: 'Light and airy with a gentle warmth and lifted shadows. Timeless and versatile.',
    gradient: 'linear-gradient(135deg, #e8f5f8 0%, #f5f0ea 50%, #ffffff 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.30,
      brightness: 0.02,
      contrast: 0.85,
      temperature: 0.10,
      saturation: 0.90,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.02, g: 0.01, b: 0,    l: 0.08 },
        midtones:   { r: 0,    g: 0,    b: 0,    l: 0    },
        highlights: { r: 0,    g: 0,    b: 0,    l: 0.03 },
      },
    },
  },

  // ── SPECIALTY ────────────────────────────────────────────────────────────────

  {
    id: 'bw-punchy',
    name: 'B&W Punchy',
    description: 'High-contrast monochrome with deep blacks and bright whites.',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #505050 50%, #f0f0f0 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      contrast: 1.30,
      saturation: 0,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0, g: 0, b: 0, l: -0.05 },
        midtones:   { r: 0, g: 0, b: 0, l:  0    },
        highlights: { r: 0, g: 0, b: 0, l:  0.04 },
      },
    },
  },

  {
    id: 'urban-grit',
    name: 'Urban Grit',
    description: 'Desaturated, high-contrast street photography look with crushed shadows.',
    gradient: 'linear-gradient(135deg, #111118 0%, #3a3a48 50%, #8a8a9e 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      contrast: 1.40,
      saturation: 0.70,
      temperature: -0.08,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: -0.04, g: -0.02, b: 0.04, l: -0.08 },
        midtones:   { r:  0,    g:  0,    b: 0,    l:  0    },
        highlights: { r:  0,    g:  0,    b: 0,    l:  0.04 },
      },
    },
  },
];
