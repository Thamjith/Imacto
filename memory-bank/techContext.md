# Tech Context — Imacto Studio

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19 |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| Routing | react-router-dom 7 |
| UI primitives | Radix UI + `@base-ui/react`; shadcn-style components in `src/components/ui` |
| Icons | Tabler Icons webfont (e.g. `ti-crop`) + `lucide-react` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + custom CSS (`src/App.css`, `src/index.css`) |
| Fonts | `@fontsource-variable/geist` |
| Class utils | `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css` |
| Image processing | Browser Canvas API (`toBlob`) — no WASM yet |
| Linting | ESLint 10 (React Hooks + React Refresh plugins) |
| Testing | Vitest 4 (unit tests for pure `src/lib` functions) |

## Development setup

**Requirements:** Node.js 18+, npm. No backend, no env vars, no secrets.

```bash
npm install
npm run dev        # Vite dev server with HMR (usually http://localhost:5173)
npm run build      # production build — must pass before handoff
npm run preview    # preview the production build
npm run lint       # ESLint
npm test           # vitest run (one-shot)
npm run test:watch # vitest watch
```

## Conventions

- **JS/JSX only — no TypeScript.** `.jsx` for components, `.js` for libs/constants.
- **No semicolons** in most source files; match the style of the file you edit.
- **Path alias `@/` → `src/`** (configured in `vite.config.js` and `jsconfig.json`).
  Import like `import { useStudio } from "@/context/StudioContext"`. A `#/*` → `./src/*`
  import map also exists in `package.json`, but **prefer `@/`**.
- **Named exports** for components (e.g. `export function CropPanel()`); default export
  only for `App`.
- Keep **pure logic in `src/lib/*`** and React state in context/components.
- Don't add narrating comments; only comment non-obvious intent.

## Technical constraints

- All media processing must stay **in-browser** — no server calls / network deps for media.
- **Canvas encoding limits:** GIF/BMP/TIFF fall back to PNG; AVIF falls back WebP → PNG
  when unsupported; SVG is rasterized to PNG on export.
- **Max upload 25 MB**, enforced in `src/lib/imageUpload.js`.

## Dependencies of note

- React 19 / react-dom 19, react-router-dom 7, Vite 8, Tailwind 4, Vitest 4, ESLint 10.
- See `package.json` for exact versions.
