# Imacto Studio

**Imacto** is a browser-based media studio for editing images (and eventually video) entirely in the client. Upload a file, adjust it with focused tools, and export the result—without sending files to a server.

> **Status: In development**  
> The UI and workflow are in place; real file processing, persistence, and video tools are not finished yet. Expect breaking changes.

## What it does

Imacto is built around a simple **Upload → Edit → Export** flow:

1. **Upload** — drag-and-drop or browse for a file (images today; video formats are listed for future support).
2. **Edit** — pick a tool from the sidebar and tune settings in the right panel.
3. **Export** — queue a download with your chosen format and quality settings.

Processing is intended to run **locally in the browser** (max ~25 MB per file), keeping files on your machine.

### Image tools (in progress)

| Tool | Description |
|------|-------------|
| **Crop & resize** | Aspect ratios, dimensions, quality, output format |
| **Compress** | Presets, quality slider, optional EXIF stripping |
| **Convert format** | WebP, AVIF, PNG, and more with color profile options |
| **Rotate & flip** | Orientation and mirroring |
| **Background remove** | Subject isolation with feather and background options |
| **Watermark** | Text overlay with position, opacity, and size |

### Video tools (planned)

Trim & clip, format conversion, and video compression are stubbed in the UI and marked **coming soon**.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | [React](https://react.dev/) 19 |
| Build | [Vite](https://vite.dev/) 8 |
| Icons | [Tabler Icons](https://tabler.io/icons) (webfont) |
| Styling | Custom CSS (`App.css`, `index.css`) |
| Linting | ESLint 10 with React Hooks and React Refresh plugins |
| Testing | [Vitest](https://vitest.dev/) (unit tests for `src/lib` pure functions) |

## Getting started

**Requirements:** Node.js 18+ and npm.

```bash
# Install dependencies
npm install

# Start dev server (HMR)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Run unit tests
npm test
```

Open the URL Vite prints (usually `http://localhost:5173`) to use the studio.

## Project layout

The studio UI is split into focused modules rather than living in a single file:

```
src/
  main.jsx                    # React entry point
  App.jsx                     # Router shell ("/" → "/crop", "/:toolId")
  App.css                     # Studio layout and component styles
  index.css                   # Global tokens and base styles
  context/
    StudioContext.jsx         # Single source of truth for studio state + actions
  pages/
    StudioPage.jsx            # Top-level layout; resolves the active tool from the URL
  constants/
    tools.js                  # Tool registry, metadata, and default tool state
  lib/                        # Framework-agnostic logic (pure where possible)
    imageUpload.js            # File validation + load (25 MB cap)
    imageExport.js            # Canvas crop/resize/compress/encode/download
    cropGeometry.js           # Aspect math, region clamping, display↔source mapping
    estimate.js               # Output size estimation
    utils.js                  # cn() classname helper
  components/
    layout/                   # Sidebar, TopBar, StageBar, NavItem
    canvas/                   # Canvas, Preview, CropOverlay, DropZone
    panels/                   # One settings panel per tool
    common/                   # Shared widgets (sliders, chips, estimate row, ...)
    ui/                        # shadcn-style primitives (button, select, slider, ...)
```

## Roadmap (high level)

- [ ] Wire up real image upload and canvas rendering
- [ ] Implement export with actual encoding (Canvas API / WASM, etc.)
- [ ] Background removal and watermark rendering
- [ ] Video tool suite (trim, convert, compress)
- [ ] Authentication, projects, and history (if needed)

## License

Not specified yet—add a license before public distribution.
