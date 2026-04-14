import { ToneMappingSettings } from '../types';

/**
 * LUT utility functions — tone mapping and filmic blend.
 */

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));

// ── Tone mapping ──────────────────────────────────────────────────────────────

/**
 * Apply a parametric S-curve with independent toe and shoulder controls.
 *
 *  toe      (0–1): lifts & softens shadows. 0 = no effect.
 *  shoulder (0–1): rolls off highlights to avoid clipping. 0 = no effect.
 *  knee     (0–1): pivot point where the shoulder curve begins.
 */
export const applyToneMappingChannel = (v: number, tm: ToneMappingSettings): number => {
  const { toe, shoulder, knee } = tm;
  let x = v;

  // Toe — gentle shadow lift using a quadratic blend
  if (toe > 0 && x < knee) {
    const t = x / knee; // 0..1 in shadow region
    // Blend straight line with a raised-toe version (power < 1 = lift)
    const toePow = 1.0 - toe * 0.5; // range 1.0 (off) → 0.5 (heavy toe)
    const toeVal = knee * Math.pow(t, toePow);
    x = x * (1 - toe) + toeVal * toe;
  }

  // Shoulder — smooth rolloff using 1 - (1-t)^n
  if (shoulder > 0 && x > knee) {
    const range = 1.0 - knee;
    if (range > 0) {
      const t = (x - knee) / range; // 0..1 in highlight region
      const exp = 1.0 + shoulder * 3.0; // 1 (off) → 4 (heavy shoulder)
      const compressed = 1.0 - Math.pow(1.0 - t, exp);
      x = knee + range * compressed;
    }
  }

  return clamp(x);
};

// ── AgX / Filmic blend ────────────────────────────────────────────────────────
// An ACES RRT-inspired filmic S-curve used for the LUT blend feature.
// Blend = 0 → identity, Blend = 100 → fully filmic.

/**
 * Hable/Uncharted-2-style filmic curve — maps linear [0..∞] to [0..1].
 * The constants are chosen to produce a warm, contrast-enhancing look.
 */
const filmicChannel = (x: number): number => {
  const A = 0.22, B = 0.30, C = 0.10, D = 0.20, E = 0.01, F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
};

const FILMIC_WHITE = filmicChannel(11.2); // reference white point

/**
 * Apply the filmic curve to a linear-light RGB triple (0–1 normalised).
 * Returns a display-encoded result in the same range.
 */
const filmicTonemap = (r: number, g: number, b: number): [number, number, number] => {
  const exposure = 2.0; // internal exposure scale — gives ACES-like output
  return [
    clamp(filmicChannel(r * exposure) / FILMIC_WHITE),
    clamp(filmicChannel(g * exposure) / FILMIC_WHITE),
    clamp(filmicChannel(b * exposure) / FILMIC_WHITE),
  ];
};

/**
 * Mix the current (graded) RGB with a filmic-tonemapped version.
 * @param r,g,b  Current graded pixel (0–1)
 * @param blend  Blend amount 0–100
 */
export const applyAgxBlend = (
  r: number, g: number, b: number,
  blend: number,
): [number, number, number] => {
  if (blend <= 0) return [r, g, b];
  const t = clamp(blend / 100);
  const [fr, fg, fb] = filmicTonemap(r, g, b);
  return [
    r + (fr - r) * t,
    g + (fg - g) * t,
    b + (fb - b) * t,
  ];
};

// ── Color wheel → zone offset ─────────────────────────────────────────────────

/**
 * Convert a colour-wheel position (x, y from -1 to +1, where 0,0 is neutral)
 * to RGB channel offsets suitable for adding to zone r/g/b values.
 *
 * The magnitude of (x,y) sets overall colour shift strength.
 * The angle maps to the standard colour wheel: 0° = red, 120° = green, 240° = blue.
 */
export const wheelToRGB = (x: number, y: number): [number, number, number] => {
  const angle = Math.atan2(y, x); // radians
  const mag   = Math.min(1, Math.sqrt(x * x + y * y));

  // Project the hue angle into the three primary channels
  const r = Math.cos(angle) * mag;
  const g = Math.cos(angle - (2 * Math.PI) / 3) * mag;
  const b = Math.cos(angle + (2 * Math.PI) / 3) * mag;

  // Scale to a comfortable offset range (±0.3)
  const scale = 0.3;
  return [r * scale, g * scale, b * scale];
};

/**
 * Inverse: given r/g/b zone offsets, recover the wheel x,y position.
 * Used to initialise the wheel indicator from existing settings.
 */
export const rgbToWheel = (r: number, g: number, b: number): [number, number] => {
  const scale = 0.3;
  const nr = r / scale;
  const ng = g / scale;
  const nb = b / scale;

  // Reconstruct via the pseudo-inverse of the 3-primary projection
  const x = nr * (2 / 3) - ng * (1 / 3) - nb * (1 / 3);
  const y = (ng - nb) * (1 / Math.sqrt(3));
  return [x, y];
};
