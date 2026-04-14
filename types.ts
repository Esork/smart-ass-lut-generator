
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
  }
};
