# Smart-Ass LUT Generator

A browser-based, real-time color grading LUT (Look-Up Table) creator. Upload any image, dial in your grade using a full suite of professional-grade controls, preview results live, then export a standard 32x32x32 HALD-style LUT PNG ready to drop into any software that supports PNG LUTs.

Deployed on **Vercel**. Built with React 19 + TypeScript + Vite.

---

## What It Does

The app lets you build a color grade visually using a canvas preview. When you're happy with the result, it bakes all your settings into a **1024×32 PNG LUT** (32 blue slices of a 32×32 grid = a full 32³ cube). This LUT can be applied to any footage or image in any compatible software (DaVinci Resolve, Premiere Pro, Photoshop, etc.).

---

## Controls

### Basic Tab
| Control | Range | Description |
|---|---|---|
| Exposure | -3 to +3 stops | Multiplies RGB by `2^exposure` |
| Brightness | -0.5 to +0.5 | Additive lift across all channels |
| Offset (Lift) | -0.5 to +0.5 | Black point lift/lower |
| Contrast | 0 to 2 | Scales around the Pivot point |
| Pivot Center | 0 to 1 | Midpoint for contrast scaling |
| Temp | -1 to +1 | Warms (R+, B-) or cools (R-, B+) |
| Tint | -1 to +1 | Green/Magenta axis shift |
| Saturation | 0 to 2 | Global HSL saturation scale |
| Vibrance | -1 to +1 | Smart saturation with skin-tone protection |

### Mixer Tab
Full 3×3 RGB channel mixer. Each output channel (Red, Green, Blue) has three source sliders that control how much R, G, and B from the input contribute to that output.

### Curves Tab
Per-channel spline curves (Master, Red, Green, Blue). Click to add control points, drag to adjust, double-click to remove. Output is a pre-computed 256-entry LUT for performance.

### Advanced Tab
Secondary color correction tools:

| Sub-tab | Description |
|---|---|
| **Zones** | Independent shadow/midtone/highlight color wheels with RGBL offsets and configurable range falloff |
| **H-H** (Hue vs Hue) | Shift the hue of specific hue ranges |
| **H-S** (Hue vs Sat) | Boost or cut saturation of specific hues |
| **H-L** (Hue vs Luma) | Brighten or darken specific hues |
| **L-S** (Luma vs Sat) | Scale saturation based on luminance (e.g. desaturate highlights) |

---

## Preview Area

- **Drag & Drop** or use the upload button to load any image.
- Toggle between **Original** and **Preview** (graded) view.
- **Scroll** to zoom, **drag** to pan.
- Type a zoom % directly or use **Fit** / **1:1** buttons.
- The live preview processes only the visible viewport pixels (capped at ~2.5MP) to stay near 60fps regardless of source image resolution.

---

## Processing Pipeline

Each pixel in the LUT passes through these stages in order:

1. Exposure (stop-based)
2. Brightness + Offset (additive)
3. White Balance (Temperature + Tint)
4. Contrast (pivot-centered)
5. Primary Curves (Master → per-channel)
6. Channel Mixer (3×3 matrix)
7. HSL Secondaries (Hue curves + Luma vs Sat + Saturation + Vibrance)
8. Zone corrections (Shadows / Midtones / Highlights)

---

## Project Structure

```
├── App.tsx                    # Root component, image upload, undo history
├── types.ts                   # LutSettings interface + DEFAULT_SETTINGS
├── index.html                 # Entry HTML (Tailwind via CDN)
├── index.tsx                  # React root mount
├── components/
│   ├── Controls.tsx           # Full right-panel UI (tabs, sliders, download)
│   ├── PreviewArea.tsx        # Canvas preview with pan/zoom
│   ├── CurveEditor.tsx        # Drag-and-drop spline curve editor
│   ├── HueCurveEditor.tsx     # Circular hue curve editor for secondaries
│   ├── Slider.tsx             # Reusable slider with inline number input
│   └── ZoneControls.tsx       # Shadow/Mid/Highlight zone controls
└── services/
    └── imageProcessing.ts     # Pixel pipeline, LUT generation, curve LUT math
```

---

## Running Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

## Deploying to Vercel

The project is a standard Vite SPA. Connect the repo to Vercel, set framework to **Vite**, and deploy. No environment variables required.

```bash
npm run build   # Outputs to /dist
```
