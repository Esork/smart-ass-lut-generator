# LUT Lab Pro

A browser-based, real-time color grading tool. Upload any image, apply a cinematic look, and export a standard **32³ LUT PNG** ready to use in DaVinci Resolve, Premiere Pro, Photoshop, or any LUT-compatible software. All processing runs in-browser — no server, no installs.

Built with React 19 + TypeScript + Vite. Deployed on Vercel.

---

## Getting Started

1. **Upload an image** — drag & drop anywhere on the app, or click "Upload Screenshot" in the panel footer
2. **Pick a preset** — browse Lifestyle, Cinematic, or Film categories and click any card to apply it instantly
3. **Tune the grade** — use Basic, Curves, and Advanced tabs to refine every detail
4. **Export** — click "Download Image" to save the graded image, or "Download LUT" to export the grade as a reusable PNG LUT

---

## Features

### Presets
Organized into four categories:

| Category | Description |
|---|---|
| **Lifestyle** | Bright, clean, social-media-friendly looks |
| **Cinematic** | High-contrast, desaturated, film-inspired grades |
| **Film** | Emulations of classic film stocks (Portra, Superia, etc.) |
| **Custom** | Your saved presets (persisted in browser) |

Click a preset card to apply it as a starting point. The active preset stays outlined so you always know what's loaded.

### Basic Tab

| Control | Range | Description |
|---|---|---|
| Exposure | -3 to +3 stops | Multiplies luminance by `2^exposure` |
| Brightness | -0.5 to +0.5 | Additive lift across all channels |
| Offset (Lift) | -0.5 to +0.5 | Raises or lowers the black point |
| Contrast | 0 to 2 | Scales around the Pivot point |
| Pivot Center | 0 to 1 | Luminance midpoint for contrast |
| Temperature | -1 to +1 | Cool (blue) ↔ Warm (orange) shift |
| Tint | -1 to +1 | Green ↔ Magenta axis |
| Saturation | 0 to 2 | Global saturation scale |
| Vibrance | -1 to +1 | Smart saturation with skin-tone protection |

### Curves Tab
Per-channel spline curves: **Master**, **Red**, **Green**, **Blue**.
- Click empty area to add a control point
- Drag points to shape the curve
- Double-click a point to remove it
- Press `R` to reset the active curve channel

### Advanced Tab

Three categories in a single panel:

**Hue Curves** — secondary color corrections:
| Sub-tab | Description |
|---|---|
| Hue vs Hue | Rotate the hue of a specific hue range |
| Hue vs Saturation | Boost or cut saturation for specific hues |
| Hue vs Luma | Brighten or darken specific hues |
| Luma vs Saturation | Scale saturation based on luminance |

**Color & Tone** — three sections stacked:
- **Zone Ranges** — Shadow Limit, Highlight Start, and Falloff sliders define where each zone begins and ends
- **Color Wheels** — drag to tint Shadows, Midtones, or Highlights; L slider below each wheel adjusts luminance offset
- **Tone Mapping** — parametric S-curve with Toe, Shoulder, and Knee controls; live curve preview canvas

**Technical**:
| Sub-tab | Description |
|---|---|
| Input Colorspace | Decode your source from sRGB, Linear, Log Alexa, Log Sony, LogC3, or Cineon |
| Filmic Look | Choose a built-in filmic tone-map (AgX, ACES, Reinhard, Hable) and set blend strength |

### Preview Area
- **Drag & drop** or click upload to load any image
- **Original / Split / Preview** toolbar — or use keyboard shortcuts
- **Scroll** to zoom, **drag** to pan
- Type a zoom % directly, or use Fit / 1:1 buttons
- Action history panel — click any past state to restore it

### Filmic Looks
Built-in mathematical tone-mapping algorithms, blended with your grade at any strength (0–100%):

| Look | Character |
|---|---|
| **AgX** | Blender's cinematic transform — natural highlight rolloff, lifted shadows |
| **ACES** | Academy industry standard — high contrast, vivid, punchy |
| **Reinhard** | Simple organic rolloff — slightly warm, never clips |
| **Hable** | Uncharted 2 curve — warm, contrasty, game-friendly |

### Custom Preset Saving
In the **Custom** preset tab, click "+ Save Current Settings as Preset" to name and save your current grade. Presets persist across sessions via `localStorage`. Delete any custom preset with the × button that appears on hover.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `X` | Toggle split-screen Before/After comparison |
| `V` | Toggle Original / Preview mode |
| `E` | Export (download) the graded image |
| `R` | Reset the active group (Curves tab: active channel; Advanced tab: active category) |
| `B` | Bypass/restore the active group |
| `Ctrl+Z` / `Cmd+Z` | Undo last adjustment |

---

## Processing Pipeline

Every pixel in the generated LUT passes through these stages in order:

1. **Input colorspace decode** — convert from scene colorspace (Log, Linear, sRGB) to working sRGB
2. **Exposure** — stop-based (`2^value`) multiplication
3. **Brightness + Offset** — additive linear corrections
4. **White Balance** — Temperature (R/B axis) and Tint (G/M axis)
5. **Contrast** — pivot-centered scaling
6. **Primary Curves** — per-channel spline (Master → R → G → B)
7. **HSL Secondaries** — Hue vs Hue/Sat/Luma, Luma vs Sat
8. **Zone corrections** — Shadows / Midtones / Highlights (RGBL offsets with smooth falloff)
9. **Saturation + Vibrance** — global and smart saturation
10. **Tone Mapping** — parametric S-curve (Toe, Shoulder, Knee)
11. **Filmic Look Blend** — mathematically blend the graded result with AgX/ACES/Reinhard/Hable

The 32³ LUT is generated off the main thread in a **web worker**, then applied to the preview image via **trilinear interpolation** — giving smooth real-time preview without blocking the UI.

---

## Input Colorspace Guide

Use the **Input Colorspace** sub-tab in Advanced → Technical to tell the tool what colorspace your source image is in.

| Colorspace | Use when… |
|---|---|
| **sRGB** | Standard photos, screenshots, web images (default) |
| **Linear** | Rendered images or HDR buffers with no gamma |
| **Log Alexa (LogC)** | ARRI Alexa camera footage |
| **Log Sony (S-Log2)** | Sony cinema camera footage |
| **Arri LogC3** | ARRI Alexa 35 / LogC3 footage |
| **Cineon / Log Film** | Scanned film or Cineon-encoded images |

The tool decodes to linear light, applies all grading, then re-encodes to sRGB for display.

---

## Exporting

### Graded Image (PNG)
Click **Download Image** (or press `E`) to save the canvas at its current viewport resolution.

### LUT (PNG)
Click **Download LUT** to export a **1024×32 PNG** containing the full 32³ LUT. Compatible with:
- **DaVinci Resolve** — Media Pool → Import LUT → select PNG format
- **Photoshop** — Filter → Camera Raw, or via Color Lookup adjustment layer
- **FFmpeg** — `ffmpeg -i input.mp4 -vf lut3d=mylut.png output.mp4`
- Any software supporting HaldCLUT or 1024×32 strip LUTs

---

## Project Structure

```
├── App.tsx                      # Root: image upload, undo history, key shortcuts
├── types.ts                     # LutSettings interface + DEFAULT_SETTINGS
├── presets.ts                   # All built-in presets (lifestyle/cinematic/film)
├── index.html / index.tsx       # Entry points
├── components/
│   ├── Controls.tsx             # Full right-panel UI (tabs, presets, sliders)
│   ├── PreviewArea.tsx          # Canvas preview: pan/zoom, split mode, history panel
│   ├── CurveEditor.tsx          # Spline curve editor (click/drag/double-click)
│   ├── HueCurveEditor.tsx       # Circular hue curve editor for secondaries
│   ├── ColorWheelControl.tsx    # Hue/sat color wheel with L offset slider
│   ├── ToneMappingControl.tsx   # Tone mapping sliders + live curve canvas
│   ├── ColorspaceSelector.tsx   # Input colorspace selector
│   ├── ZoneControls.tsx         # Zone range sliders (used internally)
│   └── Slider.tsx               # Reusable slider with tooltip + inline number input
├── services/
│   ├── imageProcessing.ts       # Full pixel pipeline, LUT generation, trilinear interp
│   ├── lutWorker.ts             # Web worker: generates LUT off-thread
│   ├── lutUtils.ts              # Filmic look math: AgX, ACES, Reinhard, Hable
│   ├── colorspaceUtils.ts       # Log/linear/sRGB conversion functions
```

---

## Running Locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → /dist
```

## Deploying

Connected to Vercel via GitHub. Every push to `main` auto-deploys. No environment variables required — fully static Vite SPA.
