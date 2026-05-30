# Active Context — Imacto Studio

_Last updated: 2026-05-30 (Background-remove manual brush added)_

## Current work focus

Added a **manual brush** to Background remove (erase/restore refinement on top of the model
cutout). Previously enabled/implemented the **Convert format** tool (real Canvas-based
re-encode). The TypeScript migration of `src/lib` is also in progress (libs are now `.ts`).
Repo has uncommitted changes across `src/lib/*`, `src/components/*`, `src/context/*`,
`src/hooks/*`, `package.json`, `tsconfig*.json`, and tool wiring.

## Recent changes (from git + handoff)

- **Convert format enabled** — removed `soon` gating; added `exportConvert` in
  `src/lib/imageExport.ts` (full-res re-encode, background flatten for non-alpha formats,
  high-quality lossy encode), branched `handleExport` on `convert`, and wired real
  source/estimate into `ConvertPanel`. Color profile is UI-only (Canvas encodes sRGB).
- `835a2eb` — Added core coding conventions + session handoff docs.
- `f2e0b48` — Disabled WIP tools (`soon` gating) and implemented real **Compress** export.
- `e03440c` — Added **Crop & resize** functionality.
- `4bbdf86` — Enhanced image upload and editing.
- Unit tests added for pure libs (`src/lib/cropGeometry.test.js`, `src/lib/estimate.test.js`).

## State of the tools

- **Real & working:** Crop & resize, Compress, Convert format, Rotate & flip, Background
  remove — all export and download locally (the first four via the Canvas pipeline).
- **Stubbed / `soon` (disabled in sidebar, routes redirect to `/crop`):** Watermark. Panel
  and default state exist but it's unreachable from the UI.
- **Video tools:** UI placeholders only — coming soon.

### Background remove (enabled 2026-05-30)
- **Library:** `@imgly/background-removal` (IS-Net fp16, ONNX Runtime + WASM, fully
  client-side). Loaded via **dynamic `import()`** so it's code-split out of the initial
  bundle. The ONNX Runtime WASM (~24 MB) ships in `dist/` as a lazy chunk; the **model
  weights (~40 MB) stream from IMG.LY's CDN** on first use and cache in browser Cache
  Storage. User images never leave the browser.
- **CDN model version == LIBRARY version, NOT the `-data` npm version.** The default
  `publicPath` is `staticimgly.com/@imgly/background-removal-data/<LIB_VERSION>/dist/` and the
  model key is `/models/isnet_fp16`. The `1.7.0` manifest has that key; the standalone
  `@imgly/background-removal-data` npm release (1.4.5) uses the OLD key naming (`/models/small`)
  and 404s the key — so **never pin publicPath to the npm data-package version**. Initial
  install uses the library default (no override). `LIB_VERSION` in `backgroundRemoval.ts`
  must track the installed `@imgly/background-removal` version.
- **Consent gate:** `src/lib/backgroundRemoval.ts` persists consent + downloaded version in
  `localStorage` (`imacto.bgmodel.v1`). `BgRemovePanel` shows a consent card (local-processing
  explainer, size, ONNX/WASM details, repo link) with a progress-tracked **Download** button;
  controls + export stay gated until the model is ready.
- **Versioning/update:** `fetchLatestModelVersion()` queries the npm registry for the latest
  **library** version (the value that determines the CDN model version). The panel offers
  "Check for updates" / "Update"; Update re-pins `publicPath` to that newer library version's
  CDN dir. Caveat: not guaranteed compatible with the installed library code, so it's an
  explicit opt-in, never used for the initial install.
- **Model variants:** `MODEL_OPTIONS` exposes the 3 IS-Net variants the library supports —
  `isnet` (Best, ~80 MB, **default**), `isnet_fp16` (Balanced), `isnet_quint8` (Fast). The
  selected variant lives in `toolState.bgremove.model` and in the store; switching re-downloads
  that variant. Arbitrary external ONNX models (e.g. onnx/models, which is also deprecated)
  are NOT supported — the engine only accepts these variants.
- **Live preview:** segmentation runs reusably (`runSegmentation` → `previewBackgroundRemoval`
  for a transparent-cutout object URL; `composeBackgroundRemoval` composites + downloads).
  `StudioContext` holds `bgPreview` ({status,url}) + `runBgPreview()`; `StudioPage` triggers it
  when the tool is active + model ready, and `Canvas`/`Preview` render the cutout over the chosen
  background (transparent→checker, white/black/blur), with a "Removing background…" overlay while
  processing. Export reuses the preview cutout to avoid a second inference pass.
- **Export:** branched in `handleExport`; `StudioContext` exposes `bgModel` / `downloadBgModel`
  (now `(version, variant, onProgress)`) / `forgetBgModel` / `bgPreview` / `runBgPreview` /
  `resetBgPreview`. Right panel widened to 264px to fit the tool controls.
- **Manual brush (added 2026-05-30):** after the model runs, users can refine the cutout with a
  brush. `useBgBrush` (`src/hooks/useBgBrush.js`, instantiated in `StudioContext`, exposed as
  `bgBrush`) keeps a **full-resolution work canvas** seeded from the model cutout. **Erase** =
  `globalCompositeOperation="destination-out"`; **Restore** = clip the brush path + redraw the
  original image. Each completed stroke snapshots `ImageData` onto an **unbounded** undo stack
  (index 0 = model output); redo stack clears on a new stroke. The edited cutout is committed to a
  PNG object URL (`bgBrush.editedUrl`) that both live preview and export reuse (export prefers
  `editedUrl` over `bgPreview.url`). State: `brushMode` (`off`/`erase`/`restore`) + `brushSize`
  (display px) in `toolState.bgremove`. UI: `BgBrushCanvas` overlay (in `Preview`, display→source
  pointer mapping like `CropOverlay`, interpolated strokes, brush-ring cursor); Undo/Redo icon
  buttons in the bottom-right `.canvas-tools` bar (brush-mode only); "Manual refine" panel section
  (Off/Erase/Restore toggle, size slider, **Reset to model output**) in `BgRemovePanel`. A JS-heap
  readout (`performance.memory`, Chromium-only, ~1.5s poll) sits in the top-right `TopBar` to make
  unbounded-history memory visible. Assumes no rotation/flip while brushing (rotate defaults to 0).
- **Not yet:** `feather` edge refinement; COOP/COEP headers for multi-threaded WASM (currently
  single-threaded). Live preview re-runs per image/variant (not on every slider tick). Brush
  snapshots are full-res + unbounded — large images can grow JS heap (surfaced by the readout).

### Rotate & flip (enabled 2026-05-30)
- `exportRotateFlip` in `src/lib/imageExport.ts`: arbitrary-angle rotation + H/V flip,
  output canvas sized to the rotated bounding box (no clipping), non-alpha targets flattened
  onto a background, `-rotated` filename suffix. Branched in `handleExport` (`StudioContext`).
- Live preview already worked (CSS transform wired through `StudioPage` → `Canvas` →
  `Preview`); enabling only required removing `soon` from the `rotate` entry in `tools.js`.

## Active decisions & considerations

- **TypeScript everywhere:** the whole project is to be migrated to TypeScript
  (`.ts`/`.tsx`); all new code must be TS. Migration of existing `.js`/`.jsx` is pending.
- **Rust + WebAssembly for heavy processing:** any image/video work that plain JS/Canvas
  can't handle efficiently should be implemented in Rust→WASM (run in a Web Worker, still
  client-side). Keep light ops on the Canvas API. No WASM module exists yet.
- Keep all media processing **client-side** (Canvas + future WASM; never a server).
- Export-only workflow: no in-place "apply/commit" that replaces the canvas image.
- `EstimateRow` uses the real `image.size` when available; falls back to a placeholder.

## Next steps (suggested)

1. **Migrate the project to TypeScript** — add `tsconfig.json`, convert config + `src/**`
   to `.ts`/`.tsx`, type `StudioContext`, the tool registry, and `src/lib` signatures.
2. **Stand up the Rust→WASM toolchain** (e.g. `wasm-pack`/`wasm-bindgen` + Vite + Web
   Worker) the first time a heavy processing need appears.
3. Apply **rotate/flip** in the export pipeline (shared `renderImage` helper) before crop.
4. Optional **Apply** action to replace `image` in state after crop (toward an undo stack).
5. Expand unit tests around `cropGeometry`, export format resolution, and `exportConvert`.
6. Consider edge handles (currently corners only) and min-crop-size UX.
7. Real color-profile handling for Convert would need a WASM encoder (Canvas is sRGB-only).

## Notes

- `memory-bank/` is now the single source of truth (the prior `imacto-studio` skill and
  its `handoff.md` were removed and folded in here). Keep `activeContext.md` and
  `progress.md` current after substantial sessions.
