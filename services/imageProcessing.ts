
import { LutSettings, Point } from '../types';
import { convertInputToWorkingSpace } from './colorspaceUtils';
import { applyToneMappingChannel, applyAgxBlend } from './lutUtils';

/**
 * Helper to clamp values between 0 and 1
 */
const clamp = (val: number) => Math.min(1, Math.max(0, val));

// --- SPLINE INTERPOLATION (Optimized) ---

/**
 * Pre-calculates a 256-value lookup table for a standard curve (0-1 range)
 */
export const createCurveLookup = (points: Point[], defaultVal: number = -1): number[] => {
  // If defaultVal is -1, use Identity (0->0, 1->1). 
  // If defaultVal is passed (e.g. 0.5), use that flat value if no points.
  if (points.length < 2) {
    if (defaultVal === -1) return new Array(256).fill(0).map((_, i) => i / 255);
    return new Array(256).fill(defaultVal);
  }

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const lut: number[] = [];
  
  for (let i = 0; i < 256; i++) {
    const val = i / 255; // Normalized x [0..1]
    
    if (val <= sorted[0].x) {
      lut.push(sorted[0].y);
      continue;
    }
    if (val >= sorted[sorted.length - 1].x) {
      lut.push(sorted[sorted.length - 1].y);
      continue;
    }

    let k = 0;
    while (val > sorted[k + 1].x) k++;

    const p0 = sorted[k];
    const p1 = sorted[k + 1];
    const deltaX = p1.x - p0.x;

    const t = (val - p0.x) / deltaX;
    const y = p0.y + t * (p1.y - p0.y);
    
    lut.push(y);
  }
  return lut;
};

/**
 * Creates a lookup for HUE curves (Circular X-Axis).
 * X = 0 and X = 1 are conceptually the same.
 */
export const createHueCurveLookup = (points: Point[], defaultVal: number): number[] => {
  if (points.length === 0) {
    return new Array(360).fill(defaultVal);
  }

  // Sort points
  let sorted = [...points].sort((a, b) => a.x - b.x);

  // Handle wrapping logic for interpolation
  // If we don't have a point at 0 or 1, we need to wrap the closest neighbors
  // Simple approach: extend points array with -1 and +1 versions
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Create a robust sorted list that covers <0 and >1 for seamless wrapping
  const extendedPoints = [
    { x: last.x - 1, y: last.y },
    ...sorted,
    { x: first.x + 1, y: first.y }
  ];

  const lut: number[] = [];
  
  // Hue is 0-360 usually, but our input points are 0-1. 
  // Let's create a LUT of size 360 for degrees.
  for (let i = 0; i < 360; i++) {
    const val = i / 360; // Normalized x [0..1]

    // Find segment in extended points
    let k = 0;
    while (k < extendedPoints.length - 1 && val > extendedPoints[k + 1].x) {
      k++;
    }

    // Fallback for boundary conditions
    if (k >= extendedPoints.length - 1) k = extendedPoints.length - 2;

    const p0 = extendedPoints[k];
    const p1 = extendedPoints[k + 1];
    const deltaX = p1.x - p0.x;

    let t = 0;
    if (deltaX !== 0) {
        t = (val - p0.x) / deltaX;
    }
    
    const y = p0.y + t * (p1.y - p0.y);
    lut.push(y);
  }
  return lut;
};


/**
 * RGB <-> HSL Conversions
 */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

const hue2rgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r, g, b]; // 0-1
};

/**
 * Context holding pre-calculated LUTs
 */
export interface ProcessingContext {
  masterLut: number[];
  redLut: number[];
  greenLut: number[];
  blueLut: number[];
  
  // Secondaries
  hueVsHueLut: number[];
  hueVsSatLut: number[];
  hueVsLumaLut: number[];
  lumaVsSatLut: number[];
}

export const createProcessingContext = (settings: LutSettings): ProcessingContext => {
  return {
    masterLut: createCurveLookup(settings.curves.master),
    redLut: createCurveLookup(settings.curves.red),
    greenLut: createCurveLookup(settings.curves.green),
    blueLut: createCurveLookup(settings.curves.blue),
    
    // Hue LUTs (size 360 for degrees)
    hueVsHueLut: createHueCurveLookup(settings.secondaries.hueVsHue, 0.5),
    hueVsSatLut: createHueCurveLookup(settings.secondaries.hueVsSat, 0.5),
    hueVsLumaLut: createHueCurveLookup(settings.secondaries.hueVsLuma, 0.5),
    
    // Luma vs Sat (size 256)
    lumaVsSatLut: createCurveLookup(settings.secondaries.lumaVsSat, 0.5),
  };
};

/**
 * MAIN PIXEL PIPELINE
 */
export const applyGradingToPixel = (
  r: number, 
  g: number, 
  b: number, 
  settings: LutSettings,
  context: ProcessingContext
): [number, number, number] => {
  // Normalize 0-1
  let nr = r / 255;
  let ng = g / 255;
  let nb = b / 255;

  // --- 0. INPUT COLORSPACE CONVERSION ---
  // Convert from scene colorspace to sRGB working space before all other ops.
  if (settings.colorspace !== 'sRGB') {
    [nr, ng, nb] = convertInputToWorkingSpace(nr, ng, nb, settings.colorspace);
  }

  // --- 1. BASIC EXPOSURE & WB ---
  
  if (settings.exposure !== 0) {
    const expFactor = Math.pow(2, settings.exposure);
    nr *= expFactor; ng *= expFactor; nb *= expFactor;
  }

  if (settings.brightness !== 0) {
    nr += settings.brightness; ng += settings.brightness; nb += settings.brightness;
  }
  
  if (settings.offset !== 0) {
    nr += settings.offset; ng += settings.offset; nb += settings.offset;
  }

  if (settings.temperature !== 0 || settings.tint !== 0) {
    nr += settings.temperature * 0.2; 
    nb -= settings.temperature * 0.2;
    ng += settings.tint * 0.2;
  }

  // --- 2. CONTRAST ---
  if (settings.contrast !== 1.0) {
    nr = (nr - settings.pivot) * settings.contrast + settings.pivot;
    ng = (ng - settings.pivot) * settings.contrast + settings.pivot;
    nb = (nb - settings.pivot) * settings.contrast + settings.pivot;
  }

  // --- 3. PRIMARY CURVES ---
  nr = clamp(nr); ng = clamp(ng); nb = clamp(nb);

  const idxR = Math.floor(nr * 255);
  const idxG = Math.floor(ng * 255);
  const idxB = Math.floor(nb * 255);

  // Master then Channel
  if (settings.curves.master.length > 2 || settings.curves.master[0].y !== 0) {
     nr = context.masterLut[idxR];
     ng = context.masterLut[idxG];
     nb = context.masterLut[idxB];
  }
  
  // Re-index for channel curves
  const idxR2 = Math.floor(clamp(nr) * 255);
  const idxG2 = Math.floor(clamp(ng) * 255);
  const idxB2 = Math.floor(clamp(nb) * 255);

  nr = context.redLut[idxR2];
  ng = context.greenLut[idxG2];
  nb = context.blueLut[idxB2];

  // --- 4. SECONDARY CURVES & HSL ---
  // Do we need HSL conversion? Only if settings differ from default
  const needsHsl = settings.saturation !== 1.0 || settings.vibrance !== 0 || 
                   settings.secondaries.hueVsHue.length > 0 ||
                   settings.secondaries.hueVsSat.length > 0 ||
                   settings.secondaries.hueVsLuma.length > 0 ||
                   settings.secondaries.lumaVsSat.length > 0;

  let luma = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;

  if (needsHsl) {
      let [h, s, l] = rgbToHsl(nr, ng, nb);
      
      // a. Hue Curves
      const hueIdx = Math.floor(h * 359);
      
      // Hue vs Hue
      // Y=0.5 is neutral. <0.5 is subtractive shift, >0.5 additive.
      if (settings.secondaries.hueVsHue.length > 0) {
        const shiftVal = context.hueVsHueLut[hueIdx]; // 0 to 1
        const shiftDeg = (shiftVal - 0.5); // -0.5 to 0.5 (representing full rotation approx if multiplied)
        // 0.5 input -> 0 shift. 
        // Let's map 0-1 range to -60deg to +60deg shift (approx 1/6 rotation)
        h = h + (shiftDeg * 0.5); 
        if (h < 0) h += 1;
        if (h > 1) h -= 1;
      }

      // Hue vs Sat
      // Y=0.5 is 1x. 0 is 0x. 1 is 2x.
      if (settings.secondaries.hueVsSat.length > 0) {
         const satScale = context.hueVsSatLut[hueIdx] * 2.0;
         s *= satScale;
      }

      // Hue vs Luma
      // Y=0.5 neutral.
      if (settings.secondaries.hueVsLuma.length > 0) {
         const lumaShift = (context.hueVsLumaLut[hueIdx] - 0.5) * 0.5; // +/- 0.25 range
         l += lumaShift;
      }
      
      // Luma vs Sat
      // X axis is Luma.
      if (settings.secondaries.lumaVsSat.length > 0) {
        const lumaIdx = Math.floor(clamp(l) * 255);
        const satScaleL = context.lumaVsSatLut[lumaIdx] * 2.0;
        s *= satScaleL;
      }

      // b. Global Saturation
      if (settings.saturation !== 1.0) {
          s *= settings.saturation;
      }
      
      // c. Vibrance (Skin Protected)
      if (settings.vibrance !== 0) {
          const satWeight = 1.0 - s;
          const skinHue = 0.097; 
          const skinBandwidth = 0.15; 
          let dist = Math.abs(h - skinHue);
          if (dist > 0.5) dist = 1.0 - dist;
          const skinWeight = Math.exp(- (dist * dist) / (2 * (skinBandwidth * skinBandwidth)));
          const protection = 1.0 - (skinWeight * 0.8);
          s *= (1.0 + (settings.vibrance * satWeight * protection));
      }
      
      // Convert back to RGB
      const [r2, g2, b2] = hslToRgb(h, clamp(s), clamp(l));
      nr = r2; ng = g2; nb = b2;
      
      // Recalc luma for Zone operations
      luma = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
  }


  // --- 6. ZONES (Shadows / Mids / Highlights) ---
  const z = settings.zones;
  // Optimization: Check if any zone setting is non-zero
  const zonesActive = 
    z.shadows.l !== 0 || z.shadows.r !== 0 || z.shadows.g !== 0 || z.shadows.b !== 0 ||
    z.midtones.l !== 0 || z.midtones.r !== 0 || z.midtones.g !== 0 || z.midtones.b !== 0 ||
    z.highlights.l !== 0 || z.highlights.r !== 0 || z.highlights.g !== 0 || z.highlights.b !== 0;

  if (zonesActive) {
      // Calculate Masks with smoothstep falloff
      const S_end = z.ranges.shadowEnd;
      const H_start = z.ranges.highlightStart;
      const falloff = z.ranges.falloff;

      // Shadow Mask: 1 at 0, 0 at S_end. Smooth transition.
      // smoothstep(min, max, x) returns 0 if x < min, 1 if x > max.
      // We want Inverse Smoothstep: 1 -> 0
      let shadowMask = 1.0 - ( (luma - (S_end - falloff)) / (falloff * 2 || 0.001) );
      shadowMask = clamp(shadowMask); 
      // Standard smoothstep implementation for better S-curve
      // But linear clamp is faster and usually sufficient for this UI.
      // Let's do simple linear ramp for performance in JS loop.
      
      let highlightMask = (luma - (H_start - falloff)) / (falloff * 2 || 0.001);
      highlightMask = clamp(highlightMask);

      const midMask = clamp(1.0 - shadowMask - highlightMask);

      // Apply Zone Offsets
      // Shadows
      if (shadowMask > 0) {
        nr += z.shadows.r * shadowMask * 0.5;
        ng += z.shadows.g * shadowMask * 0.5;
        nb += z.shadows.b * shadowMask * 0.5;
        // Luma offset (simple add)
        const lo = z.shadows.l * shadowMask * 0.5;
        nr += lo; ng += lo; nb += lo;
      }

      // Midtones
      if (midMask > 0) {
        nr += z.midtones.r * midMask * 0.5;
        ng += z.midtones.g * midMask * 0.5;
        nb += z.midtones.b * midMask * 0.5;
        const lo = z.midtones.l * midMask * 0.5;
        nr += lo; ng += lo; nb += lo;
      }

      // Highlights
      if (highlightMask > 0) {
        nr += z.highlights.r * highlightMask * 0.5;
        ng += z.highlights.g * highlightMask * 0.5;
        nb += z.highlights.b * highlightMask * 0.5;
        const lo = z.highlights.l * highlightMask * 0.5;
        nr += lo; ng += lo; nb += lo;
      }
  }

  // --- 7. TONE MAPPING ---
  const tm = settings.toneMapping;
  const tmActive = tm.toe > 0 || tm.shoulder > 0;
  if (tmActive) {
    nr = applyToneMappingChannel(nr, tm);
    ng = applyToneMappingChannel(ng, tm);
    nb = applyToneMappingChannel(nb, tm);
  }

  // --- 8. FILMIC / AgX BLEND ---
  if (settings.agxBlend > 0) {
    [nr, ng, nb] = applyAgxBlend(nr, ng, nb, settings.agxBlend);
  }

  // --- FINAL CLAMP ---
  return [
      Math.min(255, Math.max(0, nr * 255)),
      Math.min(255, Math.max(0, ng * 255)),
      Math.min(255, Math.max(0, nb * 255))
  ];
};

// ─── LUT-based preview ────────────────────────────────────────────────────────
// Builds a flat Uint8ClampedArray encoding a 32³ colour cube.
// Indexed as: (b * 32 * 32 + g * 32 + r) * 3  →  [R, G, B]
// Generation runs ~32 768 pixels through the full pipeline (≈ 5–15 ms).
// The preview then does cheap trilinear lookups instead of the full pipeline.

const LUT_SIZE = 32;

export const generateLutData = (settings: LutSettings): Uint8ClampedArray => {
  const S = LUT_SIZE;
  const data = new Uint8ClampedArray(S * S * S * 3);
  const ctx = createProcessingContext(settings);

  for (let bi = 0; bi < S; bi++) {
    for (let gi = 0; gi < S; gi++) {
      for (let ri = 0; ri < S; ri++) {
        const [r, g, b] = applyGradingToPixel(
          (ri / (S - 1)) * 255,
          (gi / (S - 1)) * 255,
          (bi / (S - 1)) * 255,
          settings,
          ctx,
        );
        const idx = (bi * S * S + gi * S + ri) * 3;
        data[idx]     = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
      }
    }
  }
  return data;
};

// Trilinear interpolation inside the 32³ cube. Input r/g/b are 0–255 integers.
export const applyLutToPixel = (
  r: number, g: number, b: number,
  lut: Uint8ClampedArray,
): [number, number, number] => {
  const S = LUT_SIZE;
  const scale = (S - 1) / 255;

  const rf = r * scale;
  const gf = g * scale;
  const bf = b * scale;

  const r0 = rf | 0;
  const g0 = gf | 0;
  const b0 = bf | 0;
  const r1 = r0 < S - 1 ? r0 + 1 : r0;
  const g1 = g0 < S - 1 ? g0 + 1 : g0;
  const b1 = b0 < S - 1 ? b0 + 1 : b0;

  const rt = rf - r0;
  const gt = gf - g0;
  const bt = bf - b0;

  // Pre-multiplied weights for the 8 corners
  const SS = S * S;
  const i000 = (b0 * SS + g0 * S + r0) * 3;
  const i100 = (b0 * SS + g0 * S + r1) * 3;
  const i010 = (b0 * SS + g1 * S + r0) * 3;
  const i110 = (b0 * SS + g1 * S + r1) * 3;
  const i001 = (b1 * SS + g0 * S + r0) * 3;
  const i101 = (b1 * SS + g0 * S + r1) * 3;
  const i011 = (b1 * SS + g1 * S + r0) * 3;
  const i111 = (b1 * SS + g1 * S + r1) * 3;

  const _r0 = 1 - rt, _g0 = 1 - gt, _b0 = 1 - bt;

  const outR =
    lut[i000]*_r0*_g0*_b0 + lut[i100]*rt*_g0*_b0 +
    lut[i010]*_r0*gt*_b0  + lut[i110]*rt*gt*_b0  +
    lut[i001]*_r0*_g0*bt  + lut[i101]*rt*_g0*bt  +
    lut[i011]*_r0*gt*bt   + lut[i111]*rt*gt*bt;

  const outG =
    lut[i000+1]*_r0*_g0*_b0 + lut[i100+1]*rt*_g0*_b0 +
    lut[i010+1]*_r0*gt*_b0  + lut[i110+1]*rt*gt*_b0  +
    lut[i001+1]*_r0*_g0*bt  + lut[i101+1]*rt*_g0*bt  +
    lut[i011+1]*_r0*gt*bt   + lut[i111+1]*rt*gt*bt;

  const outB =
    lut[i000+2]*_r0*_g0*_b0 + lut[i100+2]*rt*_g0*_b0 +
    lut[i010+2]*_r0*gt*_b0  + lut[i110+2]*rt*gt*_b0  +
    lut[i001+2]*_r0*_g0*bt  + lut[i101+2]*rt*_g0*bt  +
    lut[i011+2]*_r0*gt*bt   + lut[i111+2]*rt*gt*bt;

  return [outR, outG, outB];
};

export const generateLutUrl = (settings: LutSettings): string => {
  const width = 1024;
  const height = 32;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2d context for LUT generation");

  const lutData = ctx.createImageData(width, height);
  const data = lutData.data;
  const context = createProcessingContext(settings);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      const blueIndex = Math.floor(x / 32); 
      const xInTile = x % 32; 

      const neutralR = (xInTile / 31.0) * 255;
      const neutralG = (y / 31.0) * 255;
      const neutralB = (blueIndex / 31.0) * 255;

      const [r, g, b] = applyGradingToPixel(neutralR, neutralG, neutralB, settings, context);

      data[i] = r;     
      data[i + 1] = g; 
      data[i + 2] = b; 
      data[i + 3] = 255; 
    }
  }

  ctx.putImageData(lutData, 0, 0);
  return canvas.toDataURL("image/png");
};
