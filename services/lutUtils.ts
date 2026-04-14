import { ToneMappingSettings, FilmicLook } from '../types';

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
      const t = Math.min(1, Math.max(0, (x - knee) / range)); // clamp: x>1 would make t>1 → NaN via Math.pow
      const exp = 1.0 + shoulder * 3.0; // 1 (off) → 4 (heavy shoulder)
      const compressed = 1.0 - Math.pow(1.0 - t, exp);
      x = knee + range * compressed;
    }
  }

  return clamp(x);
};

// ── AgX tone mapping ──────────────────────────────────────────────────────────
// Real AgX implementation based on Troy Sobotka's Blender AgX and the
// minimal GLSL implementation by iolite-engine.
// Blend = 0 → identity, Blend = 100 → fully AgX.

const srgbToLinear = (v: number): number =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

const linearToSrgb = (v: number): number =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;

/**
 * AgX sigmoid curve approximation — maps [0,1] log-compressed values to [0,1].
 * Polynomial fit to the Blender "default contrast" AgX look.
 */
const agxSigmoid = (x: number): number => {
  const x2 = x * x;
  const x4 = x2 * x2;
  return  15.5   * x4 * x2
        - 40.14  * x4 * x
        + 31.96  * x4
        -  6.868 * x2 * x
        +  0.4298* x2
        +  0.1191* x
        -  0.00232;
};

const AGX_MIN_EV = -12.47393;
const AGX_MAX_EV =   4.026069;

/**
 * Apply the real AgX display transform to linear-light sRGB (0–1).
 * Returns display-encoded sRGB values (0–1), ready for the canvas.
 *
 * Pipeline (matches Blender / iolite reference):
 *   linear sRGB → inset matrix → log2 encode → sigmoid → outset matrix
 *   → pow(2.2) linearise → sRGB OETF → display
 */
const applyAgx = (r: number, g: number, b: number): [number, number, number] => {
  // 1. Inset matrix: sRGB primaries → AgX working space
  let ar = 0.842479062253094 * r + 0.0423282422610123 * g + 0.0423756549057051 * b;
  let ag = 0.0784335999999992* r + 0.878468636469772  * g + 0.0784336          * b;
  let ab = 0.0792237451477643* r + 0.0791661274605434 * g + 0.879142973793104  * b;

  // 2. Log2 encode → normalise to [0, 1]
  const logEnc = (v: number) =>
    (Math.max(AGX_MIN_EV, Math.min(AGX_MAX_EV, Math.log2(Math.max(1e-10, v)))) - AGX_MIN_EV)
    / (AGX_MAX_EV - AGX_MIN_EV);

  ar = agxSigmoid(logEnc(ar));
  ag = agxSigmoid(logEnc(ag));
  ab = agxSigmoid(logEnc(ab));

  // 3. Outset matrix: AgX working space → sRGB primaries
  let or =  1.19687900512017  * ar - 0.0528968517574562 * ag - 0.0529716355144438 * ab;
  let og = -0.0980208811401368* ar + 1.15190312990417   * ag - 0.0980434501171241 * ab;
  let ob = -0.0990297440797205* ar - 0.0989611768448433 * ag + 1.15107367264116   * ab;

  // 4. pow(2.2) — linearise from AgX perceptual space
  or = Math.pow(Math.max(0, or), 2.2);
  og = Math.pow(Math.max(0, og), 2.2);
  ob = Math.pow(Math.max(0, ob), 2.2);

  // 5. sRGB OETF — encode for HTML canvas (which interprets values as sRGB)
  return [
    clamp(linearToSrgb(or)),
    clamp(linearToSrgb(og)),
    clamp(linearToSrgb(ob)),
  ];
};

// ── ACES (Hill RRT+ODT fitted approximation) ──────────────────────────────────

/**
 * Apply ACES RRT+ODT per channel (linear input → linear output).
 * Fitted approximation by Stephen Hill — accurate to the full ACES transform.
 */
const acesChannel = (v: number): number => {
  const a = v * (v + 0.0245786) - 0.000090537;
  const b = v * (0.983729 * v + 0.432951) + 0.238081;
  return a / b;
};

const applyAces = (r: number, g: number, b: number): [number, number, number] => {
  // ACES input exposure scale (brings SDR sRGB into ACES-expected range)
  const exp = 1.8;
  const or = clamp(linearToSrgb(clamp(acesChannel(r * exp))));
  const og = clamp(linearToSrgb(clamp(acesChannel(g * exp))));
  const ob = clamp(linearToSrgb(clamp(acesChannel(b * exp))));
  return [or, og, ob];
};

// ── Reinhard (extended, luminance-preserving) ─────────────────────────────────

/**
 * Extended Reinhard tone map: v*(1+v/L²)/(1+v).
 * L_white = 4.0 → highlights roll off gently without crushing.
 */
const reinhardChannel = (v: number, lWhite = 4.0): number =>
  (v * (1.0 + v / (lWhite * lWhite))) / (1.0 + v);

const applyReinhard = (r: number, g: number, b: number): [number, number, number] => {
  const or = clamp(linearToSrgb(clamp(reinhardChannel(r))));
  const og = clamp(linearToSrgb(clamp(reinhardChannel(g))));
  const ob = clamp(linearToSrgb(clamp(reinhardChannel(b))));
  return [or, og, ob];
};

// ── Hable / Uncharted 2 ───────────────────────────────────────────────────────

/**
 * Hable/Uncharted-2-style filmic curve. Warm, punchy, game-engine classic.
 */
const hableChannel = (x: number): number => {
  const A = 0.22, B = 0.30, C = 0.10, D = 0.20, E = 0.01, F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
};
const HABLE_WHITE = hableChannel(11.2);

const applyHable = (r: number, g: number, b: number): [number, number, number] => {
  const exp = 2.0;
  const or = clamp(linearToSrgb(clamp(hableChannel(r * exp) / HABLE_WHITE)));
  const og = clamp(linearToSrgb(clamp(hableChannel(g * exp) / HABLE_WHITE)));
  const ob = clamp(linearToSrgb(clamp(hableChannel(b * exp) / HABLE_WHITE)));
  return [or, og, ob];
};

// ── Multi-look dispatcher ─────────────────────────────────────────────────────

/**
 * Mix the current graded sRGB pixel with the selected filmic look.
 * @param r,g,b   Graded pixel, normalised 0–1 (sRGB encoded)
 * @param blend   0 = untouched, 100 = fully filmic
 * @param look    Which algorithm to use
 */
export const applyAgxBlend = (
  r: number, g: number, b: number,
  blend: number,
  look: FilmicLook = 'agx',
): [number, number, number] => {
  if (blend <= 0 || look === 'none') return [r, g, b];
  const t = clamp(blend / 100);

  // All algorithms operate on linear light — linearise first
  const lr = srgbToLinear(clamp(r));
  const lg = srgbToLinear(clamp(g));
  const lb = srgbToLinear(clamp(b));

  let fr: number, fg: number, fb: number;
  if (look === 'aces')     [fr, fg, fb] = applyAces(lr, lg, lb);
  else if (look === 'reinhard') [fr, fg, fb] = applyReinhard(lr, lg, lb);
  else if (look === 'hable')    [fr, fg, fb] = applyHable(lr, lg, lb);
  else /* agx */                [fr, fg, fb] = applyAgx(lr, lg, lb);

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
  const angle = Math.atan2(x, y); // swap args: aligns visual red (top) with functional red shift
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

  // Reconstruct via the pseudo-inverse of the 3-primary projection (with swapped x/y due to new angle convention)
  const x = (ng - nb) * (1 / Math.sqrt(3));
  const y = nr * (2 / 3) - ng * (1 / 3) - nb * (1 / 3);
  return [x, y];
};
