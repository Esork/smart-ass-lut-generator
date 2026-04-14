# smart-ass-lut-generator

## Current Branch
feature/color-science-architecture

## Status: Phase 2 Complete ✅

Phase 1 (mixer removal, bypass/reset, web worker) — ✅ Done  
Phase 2 (color science architecture) — ✅ Done

---

## Phase 3 — Preset Organization & Categorization

### Goal
Reorganize presets into meaningful categories and add cinematic/film stock presets.

### Work Items
- [ ] **Modify `presets.ts`**: Add `category` field to preset interface
  - Categories: `'lifestyle' | 'cinematic' | 'film' | 'custom'`
  - Assign existing presets to categories
  - Add new presets: AgX (cinematic), Kodak (film), Fuji (film), DCI (cinematic)

- [ ] **Update `components/Controls.tsx`**:
  - Presets tab shows sub-tabs: [Lifestyle] [Cinematic] [Film] [Custom]
  - Grid layout per category
  - Each preset shows color wheel + tone mapping + colorspace preview

- [ ] **Extend `presets.ts` with new fields**:
  - `colorWheels` (shadows/midtones/highlights hue/sat)
  - `toneMapping` (toe, shoulder, knee, strength)
  - `colorspace` (sRGB Display, Log Alexa, etc.)
  - `agxBlend` (LUT blend strength if using imported LUT)

### Acceptance Criteria
- User can click "Cinematic" tab and see AgX, DCI presets
- Clicking preset applies all new color science settings
- Each preset category is visually distinct

---

## Phase 4 — LUT Loading & Blending Implementation

### Goal
Load external LUTs (AgX, etc.) and blend them with the pipeline.

### Work Items
- [ ] **Create `services/lutFileLoader.ts`**:
  - Load 3D cube LUT files from `luts/` folder
  - Parse LUT header (size, format)
  - Return as searchable array

- [ ] **Extend `services/imageProcessing.ts`**:
  - `blendWithImportedLUT(pixelColor, importedLut, strength)` function
  - Integrate into `applyGradingToPixel` pipeline (after tone mapping, before output)
  - Support LUT strength 0–1.0 slider

- [ ] **Update `components/LUTBlendControl.tsx`**:
  - File picker to load LUTs from `luts/` folder
  - Display currently loaded LUT name
  - Strength slider 0–100%
  - Reset button

- [ ] **Preload AgX LUT** on app startup

### Acceptance Criteria
- User can apply AgX preset with 100% LUT strength
- User can reduce strength to 50% and see blend
- User can load custom LUT files from `luts/` folder

---

## Phase 5 — Color Science Algorithm Implementation

### Goal
Implement colorspace conversions and log processing.

### Work Items
- [ ] **Create `services/colorspaceUtils.ts`**:
  - `convertSRGBToLinear(rgb)` and back
  - `convertToLogSpace(rgb, space)` — support Alexa Log, Sony Log, Rec709 Log
  - `convertFromLogSpace(logRgb, space)` 
  - `chromaticAdaptation(rgb, currentSpace, targetSpace)`
  - Matrix operations for color transforms

- [ ] **Extend `services/imageProcessing.ts`**:
  - Integrate colorspace conversions into pipeline
  - Process adjustments in appropriate color space (log for shadows/highlights, linear for saturation)
  - Apply inverse conversion before output

- [ ] **Update `components/ColorspaceSelector.tsx`**:
  - Show color space info (native primaries, gamma, dynamic range)
  - Live preview updates when colorspace changes
  - Tooltip explaining each space

### Acceptance Criteria
- Switching from sRGB to Log Alexa changes how color wheels affect image
- Tone mapping behaves perceptually uniform across spaces
- No color shifts when converting between spaces

---

## Phase 6 — Advanced Export & Comparison Features

### Goal
Export graded images and LUTs; enable side-by-side comparison.

### Work Items
- [ ] **Extend image export**:
  - Export options: PNG, JPEG, TIFF (16-bit if available)
  - Include metadata (preset used, settings applied)
  - "Export at scale" option (1x, 2x original)

- [ ] **LUT export features**:
  - Export current color grade as 3D LUT (3D cube format)
  - Support multiple formats: `.cube`, `.haldclut`, `.png`
  - Save as preset for reuse

- [ ] **Comparison mode**:
  - Split-screen: Before/After preview
  - Vertical or horizontal split with draggable divider
  - Keyboard shortcut (X) to toggle comparison view

- [ ] **Custom preset saving**:
  - "Save as Custom Preset" button in Presets tab
  - Edit preset name, description
  - Store in `presets/custom/` folder (local storage or backend)

### Acceptance Criteria
- User can export graded image with all adjustments baked in
- User can export color grade as LUT and apply to another image
- User can save custom preset and see it in [Custom] preset tab
- Split-screen comparison shows identical before/after frames

---

## Phase 7 — Performance & UX Refinement

### Goal
Optimize performance and polish user experience.

### Work Items
- [ ] **Performance optimization**:
  - Profile color wheel rendering (may be expensive)
  - Profile colorspace conversions (may be slow for log)
  - Add caching for colorspace matrix calculations
  - Test with 4K image at 60fps slider drags

- [ ] **UX Polish**:
  - Add keyboard shortcuts: 
    - `R` — reset current group
    - `B` — toggle bypass current group
    - `X` — toggle comparison view
    - `E` — export image
    - `V` — toggle preview/original
  - Add tooltips to all new controls
  - Add "undo" indicator (show # steps available)
  - Color wheel should show numeric hue/sat values

- [ ] **Visual refinement**:
  - Ensure color wheels render smoothly (consider canvas 2D vs SVG)
  - Make tone mapping curve visible during adjustment
  - Add visual feedback when colorspace changes
  - Dim inactive preset categories

### Acceptance Criteria
- 60fps smooth dragging with color wheels active
- Keyboard shortcuts work consistently
- All controls have helpful tooltips
- No visual lag when switching colorspaces

---

## Phase 8 — Testing & Documentation

### Goal
Ensure quality and make tool accessible.

### Work Items
- [ ] **Testing**:
  - Color accuracy tests (compare AgX output to reference)
  - Colorspace conversion tests (sRGB ↔ Linear ↔ Log)
  - Performance benchmarks (min FPS with all features enabled)
  - Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - Mobile responsiveness check

- [ ] **Documentation**:
  - README with feature overview
  - "Getting started" guide (apply preset, adjust sliders, export)
  - Preset descriptions (what each cinematic/film preset does)
  - Colorspace guide (when to use which)
  - Keyboard shortcuts reference
  - API docs if users want to extend

- [ ] **Bug fixes**:
  - Any edge cases from testing
  - Color wheel rendering issues
  - LUT loading failures
  - Export formatting bugs

### Acceptance Criteria
- All browser tests pass
- AgX preset output matches reference
- README is comprehensive and user-friendly
- No console errors or warnings

---

## Phase 9 — Release & Deployment

### Goal
Ship to production.

### Work Items
- [ ] **Build optimization**:
  - Run production build, check bundle size
  - Disable dev warnings
  - Optimize LUT loading (lazy-load if needed)

- [ ] **Hosting**:
  - Deploy to Vercel/Netlify
  - Set up custom domain (optional)
  - Enable HTTPS
  - Configure CDN caching for LUT files

- [ ] **Release notes**:
  - Write changelog for Phase 2 features
  - List known limitations
  - Ask for user feedback

### Acceptance Criteria
- Tool is live and publicly accessible
- Load time < 3 seconds on U.S. East Coast
- Mobile users can apply presets (even if color wheels are desktop-only)
- Analytics show user engagement

---

## Definition of "Finished Product"

✅ User can:
1. Upload any image
2. Click a cinematic preset (AgX, Teal&Orange, etc.)
3. Tune every aspect: color wheels, tone mapping, colorspace, LUT strength
4. See real-time preview of all adjustments
5. Export the graded image (PNG/JPEG/TIFF)
6. Export the color grade as reusable LUT
7. Save custom presets
8. Compare before/after side-by-side
9. Use tool on desktop and mobile

✅ Tool is:
- Fast (60fps with all features)
- Professional quality (accurate color science)
- Intuitive (clear UI, helpful tooltips)
- Extensible (easy to add new presets/LUTs)
- Well-documented

---

## Next Immediate Step
Start **Phase 3** — Organize presets into categories and add new cinematic/film presets.
