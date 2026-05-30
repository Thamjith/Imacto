# System Patterns — Imacto Studio

## Architecture map

```
src/
  main.jsx                    # React entry
  App.jsx                     # Router: "/" → "/crop", "/:toolId" → StudioPage
  App.css                     # Studio layout + component styles
  index.css                   # Global tokens + base styles
  context/StudioContext.jsx   # ALL studio state + actions (single source of truth)
  pages/StudioPage.jsx        # Top-level layout; reads tool from URL param
  constants/tools.js          # Tool registry, metadata, DEFAULT_TOOL_STATE
  lib/                        # Framework-agnostic logic (pure where possible)
    imageUpload.js            # File validation, load, object URL lifecycle (25 MB cap)
    imageExport.js            # Canvas crop/resize/compress/encode/download
    cropGeometry.js           # Aspect math, region clamping, display↔source mapping
    estimate.js               # Output size estimation
    utils.js                  # cn() classname helper
  components/
    layout/                   # Sidebar, TopBar, StageBar, NavItem
    canvas/                   # Canvas, Preview, CropOverlay, DropZone
    panels/                   # One panel per tool (CropPanel, CompressPanel, ...) + RightPanel
    common/                   # EstimateRow, ChipGroup, SliderField, FormatSelect, ColorSwatches, PanelSection
    ui/                        # shadcn-style primitives (button, select, slider, switch, ...)
```

## Key design decisions

- **Single source of truth:** `StudioContext` holds all studio state and actions; the UI
  reads via the `useStudio()` hook. Avoid duplicating state in components.
- **Pure logic in `src/lib`:** geometry, estimation, upload/export are framework-agnostic
  and unit-testable (Vitest). React components stay thin.
- **Tool registry drives the UI:** `constants/tools.js` declares tools, metadata, and
  default per-tool state. Adding/enabling a tool is data-first.
- **URL is the tool selector:** route `/:toolId` resolves the active tool; unknown or
  disabled tool URLs redirect to `/crop` (gated by `ENABLED_TOOL_IDS`).
- **Canvas pipeline pattern:** load → draw → `toBlob` → download
  (`loadImageElement` → `canvasToBlob` → `triggerDownload`), with filenames from
  `buildFilename(image.name, ext, "<suffix>")`.

## State model (`StudioContext`)

`useStudio()` exposes:
`image`, `loaded`, `zoom`, `step` (`upload` | `edit` | `export`), `toast`, `uploadError`,
`toolState`, `setToolState`, `uploadFile`, `handleUnload`, `handleExport(toolId)`,
`updateCropRegion(region)`, `exporting`.

- `image` = result of `loadImageFromFile`:
  `{ file, objectUrl, width, height, name, size, sizeLabel, formatLabel, mimeType }`.
  Always `revokeImageUrl` old object URLs when replacing the image.
- `toolState` is keyed by tool id, seeded from `DEFAULT_TOOL_STATE`.
- `handleExport` runs the **real** Canvas pipeline for `crop` and `compress`; other tools
  fall back to a queued-toast stub (and are currently unreachable in the UI anyway).

## Tool registry (`constants/tools.js`)

- `IMAGE_TOOLS` / `VIDEO_TOOLS` drive the sidebar.
- A tool with `soon: true` renders disabled with a "Coming soon" tooltip.
- `ENABLED_TOOL_IDS` = image tools without `soon`. `StudioPage` redirects unknown/disabled
  tool URLs to `/crop`.
- `DEFAULT_TOOL_STATE[toolId]` defines each panel's initial settings shape.

## Crop tool data model

```js
toolState.crop = {
  aspect: "Free" | "1:1" | "16:9" | "4:3" | "3:2",
  width: number,        // output width (px)
  height: number,       // output height (px)
  linked: boolean,      // lock output aspect ratio
  quality: number,      // 10–100, used for JPEG/WebP/AVIF
  format: "keep" | "png" | "webp" | ...,
  region: { x, y, width, height },  // crop rect in SOURCE image pixels
}
```

Crop preview maps source pixels ↔ letterboxed display rect via `cropGeometry.js`
(`imageDisplayRect`, `regionToDisplay`, `displayToRegion`).

## How to add / enable an image tool

1. Add/confirm the entry in `IMAGE_TOOLS` and `TOOL_META` (`constants/tools.js`); remove
   `soon: true` to enable.
2. Add default settings to `DEFAULT_TOOL_STATE[toolId]`.
3. Build `src/components/panels/<Tool>Panel.jsx` and wire it into `RightPanel.jsx`.
4. Implement export in `src/lib/imageExport.js` (reuse the Canvas pattern), then branch on
   `toolId` in `handleExport`.
5. Run `npm run lint` and `npm run build`; verify Upload → Edit → Export in `npm run dev`.

## Gotchas

- Canvas can't encode GIF/BMP/TIFF → fall back to PNG. AVIF falls back WebP → PNG.
- Max upload 25 MB; SVG is rasterized to PNG on export.
- Keep processing in-browser — no server/network for media.
- Rotate/flip is preview-transform only — not applied on export yet.
- Keep `.cursor/skills/imacto-studio/handoff.md` updated at the end of substantial sessions.
