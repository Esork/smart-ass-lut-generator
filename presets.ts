import { LutSettings, DEFAULT_SETTINGS } from './types';

export type PresetCategory = 'lifestyle' | 'cinematic' | 'film' | 'custom';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  gradient: string; // CSS gradient for the card thumbnail
  settings: LutSettings;
}

export const PRESETS: Preset[] = [
  // ── LIFESTYLE ────────────────────────────────────────────────────────────────

  {
    id: 'bright-airy',
    name: 'Bright & Airy',
    category: 'lifestyle',
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
      toneMapping: { toe: 0, shoulder: 0, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'warm-mellow',
    name: 'Warm & Mellow',
    category: 'lifestyle',
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
      toneMapping: { toe: 0, shoulder: 0, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'lifestyle',
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
      toneMapping: { toe: 0, shoulder: 0, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    category: 'lifestyle',
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
      toneMapping: { toe: 0, shoulder: 0, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  // ── CINEMATIC ────────────────────────────────────────────────────────────────

  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    category: 'cinematic',
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
      toneMapping: { toe: 0.2, shoulder: 0.1, knee: 0.6 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'moody-dark',
    name: 'Moody Dark',
    category: 'cinematic',
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
      toneMapping: { toe: 0.15, shoulder: 0.25, knee: 0.5 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'cool-crisp',
    name: 'Cool & Crisp',
    category: 'cinematic',
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
      toneMapping: { toe: 0, shoulder: 0.1, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'faded-matte',
    name: 'Faded Matte',
    category: 'cinematic',
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
      toneMapping: { toe: 0.1, shoulder: 0.05, knee: 0.75 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  // ── FILM & VINTAGE ───────────────────────────────────────────────────────────

  {
    id: 'vintage',
    name: 'Vintage',
    category: 'film',
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
      toneMapping: { toe: 0.05, shoulder: 0.05, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'clean-bright',
    name: 'Clean & Bright',
    category: 'film',
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
      toneMapping: { toe: 0, shoulder: 0, knee: 0.7 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  // ── SPECIALTY ────────────────────────────────────────────────────────────────

  {
    id: 'bw-punchy',
    name: 'B&W Punchy',
    category: 'custom',
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
      toneMapping: { toe: 0, shoulder: 0.15, knee: 0.6 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  {
    id: 'urban-grit',
    name: 'Urban Grit',
    category: 'custom',
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
      toneMapping: { toe: 0.15, shoulder: 0.2, knee: 0.55 },
      colorspace: 'sRGB',
      agxBlend: 0,
    },
  },

  // ── NEW CINEMATIC PRESETS ────────────────────────────────────────────────────

  {
    id: 'agx',
    name: 'AgX',
    category: 'cinematic',
    description: 'Professional filmic tone mapping with AgX color science. Cinematic and natural.',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3d3d5c 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.2,
      contrast: 1.15,
      saturation: 1.05,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.05, g: 0.02,  b: 0.08,  l: 0.02 },
        midtones:   { r: 0.02, g: 0,     b: -0.01, l: 0 },
        highlights: { r: 0.08, g: 0.04,  b: -0.06, l: 0 },
      },
      toneMapping: { toe: 0.3, shoulder: 0.25, knee: 0.65 },
      colorspace: 'LogAlexa',
      agxBlend: 1.0,
    },
  },

  {
    id: 'dci-p3',
    name: 'DCI P3',
    category: 'cinematic',
    description: 'Digital Cinema Initiatives grade: wide color gamut with cinematic crush.',
    gradient: 'linear-gradient(135deg, #001a33 0%, #1a3366 50%, #803300 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.1,
      contrast: 1.25,
      saturation: 1.15,
      temperature: 0.15,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.06, g: 0.01,  b: 0.12,  l: -0.02 },
        midtones:   { r: 0.03, g: 0.01,  b: -0.02, l: 0 },
        highlights: { r: 0.10, g: 0.06,  b: -0.08, l: -0.01 },
      },
      toneMapping: { toe: 0.25, shoulder: 0.3, knee: 0.6 },
      colorspace: 'Linear',
      agxBlend: 0.7,
    },
  },

  // ── NEW FILM STOCK PRESETS ───────────────────────────────────────────────────

  {
    id: 'kodak-portra',
    name: 'Kodak Portra 400',
    category: 'film',
    description: 'Warm, saturated color film stock with soft shadows. Flattering and timeless.',
    gradient: 'linear-gradient(135deg, #5c3d2e 0%, #c4804a 50%, #f5d5a8 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.1,
      contrast: 0.95,
      temperature: 0.35,
      tint: 0.08,
      saturation: 1.12,
      vibrance: 0.08,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: 0.15, g: 0.08, b: -0.05, l: 0.03 },
        midtones:   { r: 0.04, g: 0.01, b: -0.01, l: 0    },
        highlights: { r: 0.06, g: 0.03, b: -0.03, l: 0.01 },
      },
      toneMapping: { toe: 0.1, shoulder: 0.05, knee: 0.75 },
      colorspace: 'sRGB',
      agxBlend: 0.2,
    },
  },

  {
    id: 'fuji-superia',
    name: 'Fuji Superia 400',
    category: 'film',
    description: 'Cool, crisp color film with strong greens and vibrant blues. Modern yet nostalgic.',
    gradient: 'linear-gradient(135deg, #1a4d4d 0%, #2d7a7a 50%, #a0d5d5 100%)',
    settings: {
      ...DEFAULT_SETTINGS,
      exposure: 0.05,
      contrast: 1.05,
      temperature: -0.20,
      saturation: 1.15,
      vibrance: 0.12,
      zones: {
        ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
        shadows:    { r: -0.03, g: 0.04, b: 0.10,  l: 0 },
        midtones:   { r:  0,    g: 0.02, b: 0.01,  l: 0 },
        highlights: { r:  0.04, g: 0.05, b: 0.02,  l: 0.02 },
      },
      toneMapping: { toe: 0.08, shoulder: 0, knee: 0.8 },
      colorspace: 'sRGB',
      agxBlend: 0.15,
    },
  },
];
