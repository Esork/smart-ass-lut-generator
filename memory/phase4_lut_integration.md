---
name: Phase 4 LUT Integration Status
description: Current state and next steps for integrating external LUT blending
type: project
---

## Current State (as of commit 44d08ac)

### Completed
- LUT file loader service (`services/lutFileLoader.ts`)
  - Loads PNG-based LUT files (1024x32 format for 32³ cube)
  - Validates dimensions and parses into Uint8ClampedArray
  - Supports File objects (drag-drop, file picker)
  
- UI for LUT selection (`components/LUTBlendControl.tsx`)
  - File picker with drag-drop
  - Shows loaded LUT name
  - Blend strength slider (0-100%)
  - Error handling + loading state
  
- State management 
  - App.tsx: `importedLut` state
  - Controls.tsx: `loadedLutName` state
  - Passes `onLutLoad` callback through component tree

### Architecture Notes
- `importedLut` stored as `{ name, size, data: Uint8ClampedArray }` in App state
- Web worker (lutWorker.ts) currently doesn't receive LUT data
- PreviewArea doesn't accept importedLut prop yet
- Actual LUT application not yet integrated into pixel pipeline

## Next Steps for Full Integration

1. **Update PreviewAreaProps** to accept `importedLut` parameter
2. **Modify PreviewArea** to pass `importedLut` to web worker
3. **Extend lutWorker.ts** message format to include optional LUT
4. **Update imageProcessing.ts pipeline**:
   - If external LUT loaded: use `applyLutToPixel` instead of computed effect
   - Add `blendLuts` function for mixing imported + computed LUTs
   - Handle both cases in `applyGradingToPixel` or as post-process
5. **Test with AgX LUT** in luts/AgX-default_contrast.lut.png

## Key Files
- `services/lutFileLoader.ts` - PNG LUT parser
- `services/imageProcessing.ts` - pixel pipeline (add LUT application here)
- `components/PreviewArea.tsx` - needs to accept and pass through importedLut
- `lutWorker.ts` - web worker (extend message format)
- `App.tsx` - manage importedLut state

## Design Decision
Using trilinear interpolation with external LUT as the primary effect when agxBlend > 0 and external LUT is loaded. Falls back to filmic curve if no LUT is loaded.
