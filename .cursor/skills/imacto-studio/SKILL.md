---
name: imacto-studio
description: Engineering guide for the Imacto Studio codebase — a browser-local image/video editing studio built with React 19 + Vite. Read this before adding tools, wiring export pipelines, or editing the studio UI.
---

# Imacto Studio — Agent Skill

A browser-based media studio. Everything runs **client-side**: files never leave the browser. The flow is **Upload → Edit → Export**.

## Quick start

```bash
npm install
npm run dev      # Vite dev server with HMR (usually http://localhost:5173)
npm run build    # production build — must pass before handoff
npm run lint     # ESLint 10 (React Hooks + React Refresh)
```

**Requirements:** Node.js 18+, npm. No backend, no env vars, no secrets.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19 |
| Build | Vite 8 |
| Routing | react-router-dom 7 |
| UI primitives | Radix UI + `@base-ui/react`, shadcn-style components in `src/components/ui` |
| Icons | Tabler Icons (webfont, e.g. `ti-crop`) + `lucide-react` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + custom CSS (`src/App.css`, `src/index.css`) |
| Image processing | Browser Canvas API (`toBlob`), no WASM yet |

## Conventions (follow these)

- **JS/JSX only** — no TypeScript. Files use `.jsx` for components, `.js` for libs/constants.
- **No semicolons** in most source files; match the style of the file you edit.
- **Path alias `@/`** maps to `src/` (configured in `vite.config.js` and `jsconfig.json`). Import as `import { useStudio } from "@/context/StudioContext"`. There is also a `#/*` → `./src/*` import map in `package.json`; prefer `@/`.
- **Named exports** for components (e.g. `export function CropPanel()`), default export only for `App`.
- Keep pure logic in `src/lib/*` and React state in context/components.
- Don't add narrating comments; only comment non-obvious intent.

## Architecture map

```
src/
  App.jsx                     # Router: "/" → "/crop", "/:toolId" → StudioPage
  main.jsx                    # React entry
  context/StudioContext.jsx   # ALL studio state + actions (single source of truth)
  pages/StudioPage.jsx        # Top-level layout; reads tool from URL param
  constants/tools.js          # Tool registry, metadata, DEFAULT_TOOL_STATE
  lib/
    imageUpload.js            # File validation, load, object URL lifecycle (25 MB cap)
    imageExport.js            # Canvas crop/resize/compress/encode/download
    cropGeometry.js           # Aspect math, region clamping, display↔source mapping
    estimate.js               # Output size estimation
    utils.js                  # cn() classname helper
  components/
    layout/                   # Sidebar, TopBar, StageBar, NavItem
    canvas/                   # Canvas, Preview, CropOverlay, DropZone
    panels/                   # One panel per tool (CropPanel, CompressPanel, ...)
    common/                   # EstimateRow, ChipGroup, SliderField, etc.
    ui/                        # shadcn-style primitives (button, select, slider...)
```

### State model (`StudioContext`)

`useStudio()` exposes: `image`, `loaded`, `zoom`, `step` (`upload`|`edit`|`export`), `toast`, `uploadError`, `toolState`, `setToolState`, `uploadFile`, `handleUnload`, `handleExport(toolId)`, `updateCropRegion(region)`, `exporting`.

- `image` is the object returned by `loadImageFromFile` (`{ file, objectUrl, width, height, name, size, sizeLabel, formatLabel, mimeType }`). Always `revokeImageUrl` old object URLs when replacing.
- `toolState` is keyed by tool id and seeded from `DEFAULT_TOOL_STATE`.
- `handleExport` runs the **real** Canvas pipeline for `crop` and `compress`; other tools fall back to a queued-toast stub.

### Tool registry (`constants/tools.js`)

- `IMAGE_TOOLS` / `VIDEO_TOOLS` drive the sidebar.
- A tool with `soon: true` is rendered disabled with a "Coming soon" tooltip.
- `ENABLED_TOOL_IDS` = image tools without `soon`. `StudioPage` redirects unknown/disabled tool URLs to `/crop`.
- `DEFAULT_TOOL_STATE[toolId]` defines the panel's initial settings shape.

## Current status (as of latest handoff)

- **Done & real:** Crop & resize, Compress (both export via Canvas, download locally).
- **Stubbed / `soon`:** Convert, Rotate & flip, Background remove, Watermark (panels exist, sidebar disabled, routes redirect to `/crop`).
- **Video tools:** UI placeholders, coming soon.
- Rotate/flip is preview-transform only — not applied on export yet.

See [handoff.md](handoff.md) for the detailed session log and next steps.

## How to add / enable an image tool

1. Add/confirm the entry in `IMAGE_TOOLS` and `TOOL_META` in `constants/tools.js`; remove `soon: true` to enable it.
2. Add its default settings to `DEFAULT_TOOL_STATE[toolId]`.
3. Build the panel in `src/components/panels/<Tool>Panel.jsx` and wire it in `RightPanel.jsx`.
4. Implement the export in `src/lib/imageExport.js` (reuse the Canvas load → draw → `toBlob` → download pattern via `loadImageElement` → `canvasToBlob` → `triggerDownload`; name output with `buildFilename(image.name, ext, "<suffix>")`), then branch on `toolId` in `handleExport`.
5. Run `npm run lint` and `npm run build`; verify the Upload → Edit → Export flow in `npm run dev`.

## Gotchas

- Canvas can't encode GIF/BMP/TIFF — they fall back to PNG. AVIF falls back WebP → PNG when unsupported.
- Max upload is **25 MB**; SVG is rasterized to PNG on export.
- Keep processing in-browser — do not introduce server calls or network dependencies for media handling.
- Always update [handoff.md](handoff.md) at the end of a substantial session.
