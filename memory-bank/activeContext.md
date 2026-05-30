# Active Context — Imacto Studio

_Last updated: 2026-05-30 (Convert format enabled)_

## Current work focus

Enabled and implemented the **Convert format** tool (real Canvas-based re-encode). The
TypeScript migration of `src/lib` is also in progress (libs are now `.ts`). Repo has
uncommitted changes across `src/lib/*`, `package.json`, `tsconfig*.json`, and tool wiring.

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
  weights (~40 MB) stream from IMG.LY's CDN** (`staticimgly.com/@imgly/background-removal-data/<ver>/dist/`)
  on first use and cache in browser Cache Storage. User images never leave the browser.
- **Consent gate:** `src/lib/backgroundRemoval.ts` persists consent + downloaded version in
  `localStorage` (`imacto.bgmodel.v1`). `BgRemovePanel` shows a consent card (local-processing
  explainer, size, ONNX/WASM details, repo link) with a progress-tracked **Download** button;
  controls + export stay gated until the model is ready.
- **Versioning/update:** `fetchLatestModelVersion()` queries the npm registry; the panel
  offers "Check for updates" / "Update" (re-pins `publicPath` to the newer data version).
  Caveat: a newer data version isn't guaranteed compatible with the pinned library, so it's
  an explicit opt-in, not a silent swap.
- **Export:** `exportBackgroundRemoval` runs the cutout, composites onto the chosen
  background (transparent keeps alpha), encodes PNG/WebP, downloads `-nobg`. Branched in
  `handleExport`; `StudioContext` exposes `bgModel` / `downloadBgModel` / `forgetBgModel`.
- **Not yet:** live preview (runs at export only), `feather` edge refinement, COOP/COEP
  headers for multi-threaded WASM (currently single-threaded).

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
