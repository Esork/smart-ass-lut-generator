# LUT Lab Pro — Architecture Reference

## What This Tool Does

Browser-based real-time color grading tool. User uploads an image, applies grading adjustments, and gets back either a graded image PNG or a 32³ LUT PNG they can import into DaVinci Resolve / Premiere / Photoshop. All processing is client-side — no backend.

---

## Tech Stack

- React 19 + TypeScript, bundled with Vite
- Tailwind CSS for styling
- Web Worker for LUT generation (off main thread)
- Canvas API for preview rendering
- Deployed on Vercel (auto-deploy from `main` branch)

---

## File Structure

```
App.tsx                      # Root: state, undo history, keyboard shortcuts, layout
types.ts                     # LutSettings, DEFAULT_SETTINGS, FilmicLook, all shared types
presets.ts                   # Built-in presets (lifestyle / cinematic / film categories)

components/
  Controls.tsx               # Entire right panel: tabs, presets, all controls
  PreviewArea.tsx            # Left panel: canvas, pan/zoom, split mode, history popup
  CurveEditor.tsx            # Interactive spline curve (click to add, drag, dbl-click remove)
  HueCurveEditor.tsx         # Circular hue-range curve editor for secondaries
  ColorWheelControl.tsx      # Hue/sat color wheel + luminance slider
  ToneMappingControl.tsx     # Tone mapping sliders with live curve canvas preview
  ColorspaceSelector.tsx     # Dropdown for input colorspace selection
  ZoneControls.tsx           # Zone range sliders (Shadow Limit / Highlight Start / Falloff)
  Slider.tsx                 # Reusable slider: label, value input, optional tooltip

services/
  imageProcessing.ts         # Pixel pipeline + LUT generation + trilinear interpolation
  lutWorker.ts               # Web worker wrapper (receives settings, returns LUT Uint8Array)
  lutUtils.ts                # Filmic look math: AgX, ACES, Reinhard, Hable + blend dispatcher
  colorspaceUtils.ts         # sRGB / Linear / LogAlexa / LogC3 / LogSony / Cineon conversions
```

---

## Data Flow

```
User adjusts slider
  → setSettingsWithHistory() in App.tsx (debounced history snapshot)
    → settings state updates
      → PreviewArea receives new settings
        → if not default: postMessage to lutWorker
          → worker generates 32³ LUT (32768 pixels through the full pipeline)
            → LUT Uint8Array returned to main thread
              → applyLutToPixel() trilinear-interpolates every canvas pixel
                → canvas redraws
```

---

## Processing Pipeline (per pixel / per LUT cell)

Steps run in order in `imageProcessing.ts`:

1. Input colorspace decode (sRGB → linear working space)
2. Exposure (2^stops multiplication)
3. Brightness + Offset (additive lifts)
4. White Balance (Temperature R/B, Tint G/M)
5. Contrast (pivot-centered scaling)
6. Primary Curves (spline: Master → R → G → B)
7. HSL Secondaries (Hue vs Hue/Sat/Luma, Luma vs Sat)
8. Zone Corrections (Shadows / Midtones / Highlights RGBL with smooth falloff)
9. Saturation + Vibrance
10. Tone Mapping (parametric S-curve: Toe / Shoulder / Knee)
11. Filmic Look Blend (AgX / ACES / Reinhard / Hable blended at agxBlend%)

---

## Key Types (`types.ts`)

```typescript
interface LutSettings {
  // Basic
  exposure, brightness, offset, contrast, pivot
  temperature, tint, saturation, vibrance

  // Curves
  curves: { master, red, green, blue: Point[] }

  // Secondaries
  secondaries: { hueVsHue, hueVsSat, hueVsLuma, lumaVsSat: Point[] }

  // Zones
  zones: {
    shadows, midtones, highlights: { r, g, b, l: number }
    ranges: { shadowEnd, highlightStart, falloff: number }
  }

  // Tone Mapping
  toneMapping: { toe, shoulder, knee: number }

  // Technical
  colorspace: Colorspace   // 'sRGB' | 'Linear' | 'LogAlexa' | 'LogC3' | 'LogSony' | 'Cineon'
  filmicLook: FilmicLook   // 'none' | 'agx' | 'aces' | 'reinhard' | 'hable'
  agxBlend: number         // 0–100, strength of filmic look blend
}
```

---

## Controls Panel Layout

```
[Presets] [Basic] [Curves] [Adv]
  ↓ Advanced tab:
  [Hue Curves] [Color & Tone] [Technical]

  Hue Curves → [HueVsHue | HueVsSat | HueVsLuma | LumaVsSat]
  Color & Tone → Zone Ranges + Color Wheels + Tone Mapping
  Technical → [Input Colorspace | Filmic Look]
```

Each group has a Reset (↺) and Bypass (👁) icon. Bypass pushes a `previewOverride` to the preview without touching history.

---

## Undo History

- Kept in both a `useRef` (sync reads) and `useState` (UI updates)
- `setSettingsWithHistory()`: debounced 600ms — same label within window merges; different label always pushes
- Max 100 entries (`MAX_HISTORY = 100`)
- `handleJumpToHistory(index)` — restores to any point, discards future entries

---

## Filmic Looks (`services/lutUtils.ts`)

All algorithms linearize sRGB first, apply the tone-map, then blend with the original at `agxBlend%`:

- **AgX** — real Sobotka/Blender implementation: inset matrix → log2 encode → sigmoid polynomial → outset matrix → sRGB OETF
- **ACES** — Hill fitted approximation with exposure=1.8
- **Reinhard** — Extended Reinhard (L_white=4.0) with exposure=1.0
- **Hable** — Uncharted 2 curve with exposure=2.0

---

## Preset Categories

- `lifestyle` — Soft Pastel, Golden Hour, Cool & Clean, Moody Muted, Warm Skin, Airy Bright
- `cinematic` — Teal & Orange, Blade Runner, Matrix, Moonlight, Neon City, Silver Screen, AgX
- `film` — Kodak Portra 400, Fuji Superia, Kodachrome, DCI P3
- `custom` — user-saved, persisted in `localStorage` key `lut_lab_custom_presets`

---

## Known VS Code False Positives

The VS Code TypeScript language server sometimes reports `JSX element implicitly has type 'any'` errors after restarts. These are stale server cache issues — `npx tsc --noEmit` always exits clean. Restart the TS server (`Ctrl+Shift+P → TypeScript: Restart TS Server`) to clear them.

---

## Deployment

- `main` branch → Vercel auto-deploy
- No env vars needed
- `npm run build` → `/dist` (fully static SPA)
