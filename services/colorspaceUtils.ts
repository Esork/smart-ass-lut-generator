import { Colorspace } from '../types';

/**
 * Colorspace conversion utilities.
 * All functions operate on values in the [0, 1] range unless noted.
 *
 * Pipeline intent:
 *   1. convertToLinear()  — scene colorspace → linear light
 *   2. ... image processing in linear ...
 *   3. convertFromLinear() — linear light → display (sRGB)
 *
 * For sRGB input the round-trip is a no-op (sRGB → linear → sRGB).
 */

// ── sRGB ─────────────────────────────────────────────────────────────────────

/** Gamma-decode one sRGB channel to linear light (IEC 61966-2-1). */
export const sRGBToLinear = (v: number): number => {
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
};

/** Gamma-encode linear light to sRGB display. */
export const linearToSRGB = (v: number): number => {
  if (v <= 0.0031308) return 12.92 * v;
  return 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
};

// ── Arri LogC (Alexa) ────────────────────────────────────────────────────────
// Based on Arri LogC EI 800 (LogC3) transfer characteristics.

const ALEXA_CUT  = 0.010591;
const ALEXA_A    = 5.555556;
const ALEXA_B    = 0.052272;
const ALEXA_C    = 0.247190;
const ALEXA_D    = 0.385537;
const ALEXA_E    = 5.367655;
const ALEXA_F    = 0.092809;

export const logAlexaToLinear = (v: number): number => {
  if (v > ALEXA_E * ALEXA_CUT + ALEXA_F) {
    return (Math.pow(10, (v - ALEXA_D) / ALEXA_C) - ALEXA_B) / ALEXA_A;
  }
  return (v - ALEXA_F) / ALEXA_E;
};

export const linearToLogAlexa = (v: number): number => {
  if (v > ALEXA_CUT) {
    return ALEXA_C * Math.log10(ALEXA_A * v + ALEXA_B) + ALEXA_D;
  }
  return ALEXA_E * v + ALEXA_F;
};

// ── Arri LogC3 ───────────────────────────────────────────────────────────────
// LogC3 uses the same equation as LogC (above) but slightly different constants.

const C3_CUT = 0.005;
const C3_A   = 5.555556;
const C3_B   = 0.052272;
const C3_C   = 0.247190;
const C3_D   = 0.385537;
const C3_E   = 5.367655;
const C3_F   = 0.092809;

export const logC3ToLinear = (v: number): number => {
  if (v > C3_E * C3_CUT + C3_F) {
    return (Math.pow(10, (v - C3_D) / C3_C) - C3_B) / C3_A;
  }
  return (v - C3_F) / C3_E;
};

// ── Sony S-Log2 ──────────────────────────────────────────────────────────────

export const logSonyToLinear = (v: number): number => {
  if (v < 0.030001222851889303) {
    return (v - 0.092864125) / 3.53881278538813;
  }
  return Math.pow(10, (v - 0.616596 - 0.03) / 0.432699) * 0.037584 - 0.037584;
};

export const linearToLogSony = (v: number): number => {
  if (v < 0) {
    return (v * 3.53881278538813) + 0.092864125;
  }
  return (0.432699 * Math.log10(v / 0.037584 + 1) + 0.616596 + 0.03);
};

// ── Cineon / Log Film ────────────────────────────────────────────────────────
// Generic Cineon log encoding (used in scanned film).

export const cineonToLinear = (v: number): number => {
  return Math.pow(10, (1023 * v - 685) / 300);
};

export const linearToCineon = (v: number): number => {
  return (300 * Math.log10(Math.max(v, 1e-10)) + 685) / 1023;
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Convert a single normalised channel value (0–1) from the given scene
 * colorspace to linear light.
 */
export const channelToLinear = (v: number, cs: Colorspace): number => {
  switch (cs) {
    case 'sRGB':     return sRGBToLinear(v);
    case 'Linear':   return v;
    case 'LogAlexa': return logAlexaToLinear(v);
    case 'LogC3':    return logC3ToLinear(v);
    case 'LogSony':  return logSonyToLinear(v);
    case 'Cineon':   return cineonToLinear(v);
  }
};

/**
 * Convert from linear light back to sRGB for display.
 * (We always display in sRGB regardless of input colorspace.)
 */
export const channelFromLinear = (v: number): number => linearToSRGB(v);

/**
 * Convert an RGB triple (0–1) from scene colorspace to linear, then to sRGB.
 * Returns an sRGB triple ready for the rest of the grading pipeline.
 */
export const convertInputToWorkingSpace = (
  r: number, g: number, b: number,
  cs: Colorspace,
): [number, number, number] => {
  if (cs === 'sRGB') return [r, g, b]; // no-op — working space is already sRGB
  const lr = channelToLinear(r, cs);
  const lg = channelToLinear(g, cs);
  const lb = channelToLinear(b, cs);
  // Bring to sRGB display gamma for the rest of the pipeline
  return [
    Math.min(1, Math.max(0, linearToSRGB(lr))),
    Math.min(1, Math.max(0, linearToSRGB(lg))),
    Math.min(1, Math.max(0, linearToSRGB(lb))),
  ];
};
