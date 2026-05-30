# Imacto Studio — Session Handoff

Last updated: 2026-05-25

This document summarizes work done to implement **Crop & resize** and related wiring so a future session can continue without re-discovering the codebase.

---

## Goal of this session

Add real **crop and resize** behavior (browser-local processing) and document changes in this file.

---

## What was implemented

### 1. Image processing (`src/lib/imageExport.js`)

- `exportCropResize(image, cropState)` — loads the image, crops the selected `region`, scales to output `width` × `height`, encodes via Canvas `toBlob`, and triggers a download.
- `resolveOutputFormat(format, image)` — maps panel format (`keep`, `png`, `webp`, `avif`, etc.) to MIME type and extension.
- AVIF falls back to WebP then PNG if the browser cannot encode AVIF.
- GIF/BMP/TIFF export as PNG (Canvas limitation).
- SVG uploads export as PNG.
- Output filename: `{original-base}-cropped.{ext}`.

### 2. Crop geometry helpers (`src/lib/cropGeometry.js`)

- Aspect presets: Free, 1:1, 16:9, 4:3, 3:2.
- `centerCropWithAspect` — centered max crop for a fixed aspect.
- `clampCropRegion`, `parseDimension`, `linkedDimensionPair`, `outputAspectRatio`.
- Coordinate mapping: `imageDisplayRect`, `regionToDisplay`, `displayToRegion` (letterboxed preview ↔ source pixels).
- `resizeRegionFromHandle` — corner drag + move with optional aspect lock.

### 3. Interactive crop UI (`src/components/canvas/CropOverlay.jsx`)

- Overlay aligned to the **actual image bounds** inside the preview (not a fixed inset).
- Darkened shade outside crop box.
- Draggable crop box (move) and four corner handles (resize).
- Respects aspect ratio from the panel when not **Free**.
- New styles in `src/App.css` (`.crop-layer`, `.crop-shade`, `.crop-overlay-interactive`, handle cursors).

### 4. Preview & canvas

- **`Preview.jsx`** — accepts `sourceWidth/Height`, `outputWidth/Height`, `cropRegion`, `cropAspect`, `onCropRegionChange`; shows crop overlay when enabled; label shows `crop → output` sizes.
- **`Canvas.jsx`** — passes crop state from context; meta row shows crop and output dimensions on the crop tool.

### 5. Crop panel (`src/components/panels/CropPanel.jsx`)

- Aspect chips re-center crop and update output size when **linked**.
- Width/height inputs drive **output** dimensions (resize target); linked ratio follows aspect preset or crop box (Free).
- **Reset crop to image** button.
- Help text clarifies drag handles vs output size.

### 6. State & export (`src/context/StudioContext.jsx`)

- Crop state extended with `region: { x, y, width, height }` (source pixels).
- On upload, `initialCropState` sets region to full image and output size to image dimensions.
- `updateCropRegion(region)` — updates crop box; when aspect is **Free** and **linked**, syncs output width/height to crop size.
- `handleExport(toolId)` — when `toolId === "crop"`, runs real export; other tools still show the previous “queued” toast stub.
- `exporting` flag disables export button and shows “Exporting…”.

### 7. Wiring

- **`src/constants/tools.js`** — `DEFAULT_TOOL_STATE.crop.region` added.
- **`src/pages/StudioPage.jsx`** — passes crop props to `Canvas`; export uses active `tool`.
- **`src/components/panels/RightPanel.jsx`** — passes `imageWidth` / `imageHeight` into `CropPanel`; `exporting` + `image` props.

---

## Crop tool data model

```js
toolState.crop = {
  aspect: "Free" | "1:1" | "16:9" | "4:3" | "3:2",
  width: number,        // output width (px)
  height: number,       // output height (px)
  linked: boolean,      // lock output aspect ratio
  quality: number,      // 10–100, used for JPEG/WebP/AVIF
  format: "keep" | "png" | "webp" | ...,
  region: { x, y, width, height },  // crop rect in source image pixels
}
```

**Flow:** User selects crop region (overlay or aspect presets) → sets output dimensions → **Export file** downloads processed image.

---

## Files created

| File | Purpose |
|------|---------|
| `src/lib/cropGeometry.js` | Aspect math, region clamping, display mapping |
| `src/lib/imageExport.js` | Canvas crop/resize/encode/download |
| `src/components/canvas/CropOverlay.jsx` | Interactive crop handles |
| `handoff.md` | This handoff |

## Files modified

| File | Change |
|------|--------|
| `src/constants/tools.js` | `crop.region` in default state |
| `src/context/StudioContext.jsx` | Crop init, `updateCropRegion`, real crop export |
| `src/components/canvas/Preview.jsx` | Crop overlay integration |
| `src/components/canvas/Canvas.jsx` | Crop props and meta display |
| `src/components/panels/CropPanel.jsx` | Aspect/dimension/reset logic |
| `src/components/panels/RightPanel.jsx` | Image dimensions for crop panel |
| `src/pages/StudioPage.jsx` | Crop + export wiring |
| `src/App.css` | Interactive crop overlay styles |

---

## Still stubbed / not done

- **Convert, rotate, bg remove, watermark** — disabled in the sidebar with a **soon** badge (like video tools). Their routes redirect to `/crop`. Panels/state still exist but are unreachable from the UI.
- **Rotate & flip** — preview transform only; not applied on crop/compress export.
- **EstimateRow** — uses the real `image.size` when available (falls back to “2.4 MB” when no image).
- **Video tools** — coming soon in sidebar.
- **Apply without export** — no in-place “commit crop” to replace canvas image (export-only workflow).
- Edge handles (only corners), no min crop size UX beyond clamping.

---

## Session 2026-05-30 — Disable WIP tools + Compress export

### Sidebar “soon” gating
- `src/constants/tools.js` — added `soon: true` to `convert`, `rotate`, `bgremove`, `watermark`; added `ENABLED_TOOL_IDS` (image tools without `soon`).
- `src/components/layout/Sidebar.jsx` — image tools now render `disabled`/`soon` from `t.soon` with a “Coming soon” tooltip, reusing the same `NavItem` treatment as video tools.
- `src/pages/StudioPage.jsx` — valid-tool check now uses `ENABLED_TOOL_IDS`, so direct navigation to a disabled tool URL redirects to `/crop`.

### Compress export (real, browser-local)
- `src/lib/imageExport.js` — `buildFilename` now takes a `suffix` arg (default `cropped`); new `exportCompress(image, compressState)` re-encodes the full-resolution image, applying `quality` to lossy formats (JPEG/WebP/AVIF), keeping original format, and stripping EXIF via canvas re-encode. Output filename: `{base}-compressed.{ext}`.
- `src/context/StudioContext.jsx` — `handleExport` runs the real Canvas pipeline for both `crop` and `compress` (downloads + “Downloaded …” toast); other tools are unreachable now.
- `src/lib/estimate.js` — `estimateKB(quality, format, baseKB?)` accepts an optional base size.
- `src/components/common/EstimateRow.jsx` — uses real `originalBytes` when provided.
- `src/components/panels/CompressPanel.jsx` + `src/components/panels/RightPanel.jsx` — pass `image` into the compress panel so the estimate reflects the uploaded file.

---

## How to verify

```bash
npm run dev
```

1. Open `/crop` (default route).
2. Upload an image (JPG/PNG/WebP, etc.).
3. Drag crop handles or pick an aspect ratio.
4. Adjust output width/height and quality/format.
5. Click **Export file** — file should download with `-cropped` suffix.

```bash
npm run build   # passes
```

---

## Suggested next steps

1. Apply **rotate/flip** in `exportCropResize` (or shared `renderImage` helper) before crop.
2. Wire **compress** / **convert** export using the same Canvas pipeline.
3. Pass real `image.size` into `EstimateRow` for crop tool.
4. Optional **Apply** action to replace `image` in state after crop (non-destructive undo stack later).
5. Add unit tests for `cropGeometry.js` (pure functions).

---

## Recent git context

Latest commit before this session’s uncommitted work:

- `4bbdf86` — Enhance image upload and editing functionality in Imacto Studio

This session’s crop/resize work may be uncommitted until the user asks for a commit.
