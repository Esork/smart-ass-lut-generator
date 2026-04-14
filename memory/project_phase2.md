---
name: Phase 2 completion
description: Phase 2 professional color grading features fully implemented on feature/color-science-architecture branch
type: project
---

Phase 2 implementation is complete and builds cleanly (tsc --noEmit + vite build pass).

**Why:** Phase 1 established a solid LUT grading foundation. Phase 2 adds professional color science tools matching the CLAUDE.md spec.

**How to apply:** Phase 2 is done; next work would be Phase 3 features or shipping this branch.

## New files created
- `services/colorspaceUtils.ts` — sRGB, Linear, LogAlexa, LogC3, LogSony, Cineon conversions
- `services/lutUtils.ts` — parametric tone mapping (toe/shoulder/knee), filmic Hable blend, color wheel ↔ RGB math
- `components/ColorWheelControl.tsx` — canvas-based interactive hue/sat wheel; maps to zone r/g/b offsets
- `components/ToneMappingControl.tsx` — Toe / Shoulder / Knee sliders
- `components/ColorspaceSelector.tsx` — grid of colorspace buttons
- `components/LUTBlendControl.tsx` — 0–100% filmic blend slider

## Modified files
- `types.ts` — added `ToneMappingSettings`, `Colorspace`, `COLORSPACE_LABELS`; new fields `toneMapping`, `colorspace`, `agxBlend` on `LutSettings`
- `services/imageProcessing.ts` — step 0: colorspace conversion; steps 7–8: tone mapping + filmic blend
- `components/Controls.tsx` — 9 Advanced sub-tabs total: Zones, H-H, H-S, H-L, L-S, Wheels, Tone, Space, Filmic; sidebar widened to 28rem
- `App.tsx` — sidebar widened to md:w-[28rem]

## Architecture notes
- Color wheels reuse existing `ZoneSettings.zones.{shadows,midtones,highlights}.r/g/b` — no new type needed
- `agxBlend` uses a Hable/Uncharted-2 filmic curve (mathematical, no PNG LUT loaded at runtime)
- Colorspace conversion happens at the very start of `applyGradingToPixel` before all other ops
