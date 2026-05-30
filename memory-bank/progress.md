# Progress — Imacto Studio

_Last updated: 2026-05-30_

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
- **Output size estimation** (`src/lib/estimate.js`), using real file size when available.
- **Sidebar** with image tools + "coming soon" gating for WIP tools and video tools.
- **Unit tests** for pure libs (`cropGeometry`, `estimate`) via Vitest.

## What's left to build

- **TypeScript migration** — convert the whole project from `.js`/`.jsx` to `.ts`/`.tsx`,
  add `tsconfig.json`, and type the context/registry/lib surfaces.
- **Rust + WebAssembly pipeline** — toolchain + first WASM module for heavy media
  processing (introduced when the first heavy need appears; runs client-side in a Worker).
- **Convert format** export (panel exists, currently `soon`/disabled).
- **Rotate & flip** applied on export (currently preview-transform only).
- **Background remove** (subject isolation) — stubbed.
- **Watermark** rendering — stubbed.
- **Video tools** (trim, convert, compress) — UI placeholders only.
- **Apply/commit** action to replace the in-state image after an edit (undo stack later).
- Edge handles for crop (corners only today), min-crop-size UX.
- Persistence/projects/history and auth — not started (may be out of scope).

## Current status

Early but functional. Two image tools (Crop & resize, Compress) are production-real and
export locally. The remaining image tools and all video tools are UI stubs disabled behind
"coming soon". Memory bank initialized on 2026-05-30.

**Architectural direction (2026-05-30):** the project will move to **TypeScript**
everywhere, and heavy image/video processing beyond plain JS/Canvas will be implemented in
**Rust → WebAssembly** (client-side, in a Web Worker). Both are not yet started in code.

## Known issues / limitations

- Canvas can't encode GIF/BMP/TIFF (fall back to PNG); AVIF falls back WebP → PNG; SVG
  rasterizes to PNG on export.
- Rotate/flip not applied during export.
- No in-place edit commit — workflow is export-only.
- No license specified yet (see README).
