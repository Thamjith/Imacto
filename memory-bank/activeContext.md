# Active Context — Imacto Studio

_Last updated: 2026-05-30_

## Current work focus

Memory bank just initialized. No active feature work in progress in this session beyond
documentation. Repo has uncommitted changes to `README.md`, `package.json`,
`package-lock.json`, plus new `.cursorignore` and `.vscode/extensions.json`.

## Recent changes (from git + handoff)

- `835a2eb` — Added core coding conventions + session handoff docs.
- `f2e0b48` — Disabled WIP tools (`soon` gating) and implemented real **Compress** export.
- `e03440c` — Added **Crop & resize** functionality.
- `4bbdf86` — Enhanced image upload and editing.
- Unit tests added for pure libs (`src/lib/cropGeometry.test.js`, `src/lib/estimate.test.js`).

## State of the tools

- **Real & working:** Crop & resize, Compress — both export via the Canvas pipeline and
  download locally.
- **Stubbed / `soon` (disabled in sidebar, routes redirect to `/crop`):** Convert,
  Rotate & flip, Background remove, Watermark. Panels and default state exist but are
  unreachable from the UI.
- **Video tools:** UI placeholders only — coming soon.

## Active decisions & considerations

- Keep all media processing **client-side** (Canvas, no WASM/server yet).
- Export-only workflow: no in-place "apply/commit" that replaces the canvas image.
- `EstimateRow` uses the real `image.size` when available; falls back to a placeholder.

## Next steps (suggested)

1. Apply **rotate/flip** in the export pipeline (shared `renderImage` helper) before crop.
2. Wire **Convert** export using the same Canvas pipeline, then enable the tool.
3. Optional **Apply** action to replace `image` in state after crop (toward an undo stack).
4. Expand unit tests around `cropGeometry.js` and export format resolution.
5. Consider edge handles (currently corners only) and min-crop-size UX.

## Notes

- The engineering skill (`.cursor/skills/imacto-studio/SKILL.md`) and `handoff.md` are the
  authoritative running logs — keep them in sync with this file after substantial sessions.
