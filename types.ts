
export interface Point {
  x: number;
  y: number;
}

export interface CurveSettings {
  master: Point[];
  red: Point[];
  green: Point[];
  blue: Point[];
}

export interface SecondaryCurves {
  hueVsHue: Point[]; // x: hue 0-1, y: shift 0-1 (0.5 neutral)
  hueVsSat: Point[]; // x: hue 0-1, y: scale 0-1 (0.5 neutral -> 1x, 0->0x, 1->2x)
  hueVsLuma: Point[]; // x: hue 0-1, y: val 0-1 (0.5 neutral)
  lumaVsSat: Point[]; // x: luma 0-1, y: sat scale 0-1
}

export interface ZoneVector {
  r: number;
  g: number;
  b: number;
  l: number; // luminance/exposure offset
}

export interface ZoneSettings {
  ranges: {
    shadowEnd: number;
    highlightStart: number;
    falloff: number;
  };
  shadows: ZoneVector;
  midtones: ZoneVector;
  highlights: ZoneVector;
}

// ── Phase 2 types ─────────────────────────────────────────────────────────────

export interface ToneMappingSettings {
  toe: number;      // 0–1: shadow lift / compress
  shoulder: number; // 0–1: highlight rolloff strength
  knee: number;     // 0–1: where shoulder begins (default 0.7)
}

export type Colorspace = 'sRGB' | 'Linear' | 'LogAlexa' | 'LogSony' | 'LogC3' | 'Cineon';

export type FilmicLook = 'none' | 'agx' | 'aces' | 'reinhard' | 'hable';

export const FILMIC_LOOK_LABELS: Record<FilmicLook, string> = {
  none:     'None',
  agx:      'AgX',
  aces:     'ACES',
  reinhard: 'Reinhard',
  hable:    'Hable',
};

export const FILMIC_LOOK_DESCRIPTIONS: Record<FilmicLook, string> = {
  none:     'No filmic processing — pure color grade output.',
  agx:      'Blender\'s cinematic transform. Natural highlight rolloff, lifted shadows, slightly desaturated.',
  aces:     'Academy industry standard. High contrast, vivid colors, punchy highlights.',
  reinhard: 'Simple organic rolloff. Gentle, never clips, slightly warm cast.',
  hable:    'Uncharted 2 curve. Warm, contrasty, game-friendly look.',
};

export const COLORSPACE_LABELS: Record<Colorspace, string> = {
  sRGB:     'sRGB',
  Linear:   'Linear',
  LogAlexa: 'Log Alexa (LogC)',
  LogSony:  'Log Sony (S-Log2)',
  LogC3:    'Arri LogC3',
  Cineon:   'Cineon / Log Film',
};

// ── Main settings ─────────────────────────────────────────────────────────────

export interface LutSettings {
  // Basic / Exposure
  exposure: number; // In stops
  brightness: number; // Simple Lift/Offset
  offset: number;

  // Contrast
  contrast: number;
  pivot: number; // 0.0 to 1.0

  // White Balance
  temperature: number; // Kelvin shift simulation (-1.0 to 1.0)
  tint: number; // Green/Magenta axis (-1.0 to 1.0)

  // Color
  saturation: number;
  vibrance: number; // Smart saturation

  // Curves
  curves: CurveSettings;

  // Advanced: Secondaries
  secondaries: SecondaryCurves;

  // Advanced: Zones
  zones: ZoneSettings;

  // Phase 2: Tone Mapping
  toneMapping: ToneMappingSettings;

  // Phase 2: Input Colorspace
  colorspace: Colorspace;

  // Phase 2: AgX / Filmic LUT blend (0–100)
  agxBlend: number;

  // Filmic look algorithm to blend toward
  filmicLook: FilmicLook;
}

export interface HistoryEntry {
  snapshot: LutSettings;
  label: string;
}

export const DEFAULT_SETTINGS: LutSettings = {
  exposure: 0,
  brightness: 0,
  offset: 0,
  contrast: 1.0,
  pivot: 0.5,
  temperature: 0,
  tint: 0,
  saturation: 1.0,
  vibrance: 0.0,
  curves: {
    master: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    red: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    green: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    blue: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  },
  secondaries: {
    hueVsHue: [],
    hueVsSat: [],
    hueVsLuma: [],
    lumaVsSat: []
  },
  zones: {
    ranges: { shadowEnd: 0.33, highlightStart: 0.66, falloff: 0.1 },
    shadows: { r: 0, g: 0, b: 0, l: 0 },
    midtones: { r: 0, g: 0, b: 0, l: 0 },
    highlights: { r: 0, g: 0, b: 0, l: 0 }
  },
  toneMapping: {
    toe: 0,
    shoulder: 0,
    knee: 0.7,
  },
  colorspace: 'sRGB',
  agxBlend: 0,
  filmicLook: 'none',
};
