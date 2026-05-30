# Progress — Imacto Studio

_Last updated: 2026-05-30 (Convert format enabled)_

## What works

- **App shell & routing:** `/` redirects to `/crop`; `/:toolId` resolves the active tool;
  unknown/disabled tools redirect to `/crop`.
- **Upload:** drag-and-drop / browse, validation (type + 25 MB cap), object-URL lifecycle
  (`src/lib/imageUpload.js`).
- **State management:** `StudioContext` as single source of truth (`useStudio()`).
- **Live preview** with interactive **crop overlay** (move + corner-resize handles),
  aspect-ratio locking, source↔display coordinate mapping.
- **Crop & resize tool:** aspect presets, output dimensions, quality/format, real Canvas
  export → local download (`-cropped` suffix).
- **Compress tool:** presets, quality slider, EXIF stripping via re-encode, real Canvas
  export → local download (`-compressed` suffix).
- **Convert format tool:** target-format select (WebP/AVIF/PNG/JPG; GIF/BMP/TIFF→PNG),
  background flatten for non-alpha targets, high-quality re-encode, real Canvas export →
  local download (`-converted` suffix). Color profile is a UI-only selection.
- **Rotate & flip tool:** arbitrary-angle rotation (90° steps + fine-angle slider) and
  horizontal/vertical flip, live CSS-transform preview, real Canvas export sized to the
  rotated bounding box (no corner clipping), non-alpha targets flattened onto a background,
  → local download (`-rotated` suffix).
- **Background remove tool:** on-device ML segmentation via `@imgly/background-removal`
  (IS-Net fp16, ONNX Runtime + WASM, fully client-side). Gated behind a **consent screen**
  (explains local processing + size + repo link) before the model downloads; weights are
  cached locally (Cache Storage) and the version is recorded in `localStorage`. Supports a
  **version/update check** (npm registry) with a manual update, transparent/white/black
  background replacement, PNG/WebP output → local download (`-nobg` suffix). Export is
  disabled until the model is downloaded.
- **Output size estimation** (`src/lib/estimate.js`), using real file size when available.
- **Sidebar** with image tools + "coming soon" gating for WIP tools and video tools.
- **Unit tests** for pure libs (`cropGeometry`, `estimate`) via Vitest.

## What's left to build

- **TypeScript migration** — convert the whole project from `.js`/`.jsx` to `.ts`/`.tsx`,
  add `tsconfig.json`, and type the context/registry/lib surfaces.
- **Rust + WebAssembly pipeline** — toolchain + first WASM module for heavy media
  processing (introduced when the first heavy need appears; runs client-side in a Worker).
- **Watermark** rendering — stubbed.
- **Video tools** (trim, convert, compress) — UI placeholders only.
- **Apply/commit** action to replace the in-state image after an edit (undo stack later).
- Edge handles for crop (corners only today), min-crop-size UX.
- Persistence/projects/history and auth — not started (may be out of scope).

## Current status

Early but functional. Five image tools (Crop & resize, Compress, Convert format, Rotate &
flip, Background remove) are production-real and export locally. Watermark and all video
tools remain UI stubs disabled behind "coming soon". Memory bank initialized on 2026-05-30.

**Architectural direction (2026-05-30):** the project will move to **TypeScript**
everywhere, and heavy image/video processing beyond plain JS/Canvas will be implemented in
**Rust → WebAssembly** (client-side, in a Web Worker). Both are not yet started in code.

## Known issues / limitations

- Canvas can't encode GIF/BMP/TIFF (fall back to PNG); AVIF falls back WebP → PNG; SVG
  rasterizes to PNG on export.
- Rotate & flip exports independently of crop (no combined rotate-then-crop pipeline yet);
  the in-canvas preview rotates via CSS transform only.
- Background remove bundles the **ONNX Runtime WASM (~24 MB, lazy-loaded chunk)** into the
  build (engine, not weights); model weights (~40 MB) stream from IMG.LY's CDN on first use
  and cache locally. No live preview (runs at export). Auto "update" can only re-point to a
  newer published data version — not guaranteed compatible with the pinned library, so it's
  surfaced as an opt-in. Multi-threaded WASM needs COOP/COEP headers (not set) → currently
  single-threaded (slower). The `feather` control is not yet wired into the cutout.
- No in-place edit commit — workflow is export-only.
- No license specified yet (see README).
