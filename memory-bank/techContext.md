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
| Language | **TypeScript** (target state — see migration note below) |
| Light image processing | Browser Canvas API (`toBlob`) for simple ops |
| Heavy media processing | **Rust compiled to WebAssembly** (see policy below) |
| Linting | ESLint 10 (React Hooks + React Refresh plugins) |
| Testing | Vitest 4 (unit tests for pure logic) |

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

- **TypeScript everywhere.** `.tsx` for components, `.ts` for libs/constants. New code
  must be written in TypeScript with proper typing (no `any` escape hatches without a
  reason). The existing `.js`/`.jsx` source predates this decision and is being migrated
  (see migration note).
- **No semicolons** in most source files; match the style of the file you edit.
- **Path alias `@/` → `src/`** (configured in `vite.config.ts` and `tsconfig.json` after
  migration; currently `vite.config.js` / `jsconfig.json`).
  Import like `import { useStudio } from "@/context/StudioContext"`. A `#/*` → `./src/*`
  import map also exists in `package.json`, but **prefer `@/`**.
- **Named exports** for components (e.g. `export function CropPanel()`); default export
  only for `App`.
- Keep **pure logic in `src/lib/*`** and React state in context/components.
- Don't add narrating comments; only comment non-obvious intent.

## Performance policy: Rust + WebAssembly for heavy processing

- **Rule:** when image/video processing exceeds what plain JavaScript (incl. the Canvas
  API) can handle efficiently — large files, pixel-heavy or compute-bound operations, real
  video codecs/transcoding, background removal, etc. — implement it in **Rust compiled to
  WebAssembly** rather than pushing JS harder.
- **Still client-side.** WASM runs in the browser; this does **not** introduce a server.
  The "files never leave the browser" guarantee holds.
- **Where the line is:** keep simple, fast ops (basic crop/resize/re-encode) on the Canvas
  API. Reach for Rust/WASM when JS is the bottleneck (slow, janky, or impossible).
- **Suggested toolchain:** `wasm-pack` / `wasm-bindgen` for the Rust→WASM build, run the
  heavy work off the main thread in a Web Worker, and load the `.wasm` via Vite. Validate
  the exact toolchain when the first WASM module is introduced.

## Migration notes (in progress / planned)

- **JS → TypeScript:** the whole project is being migrated to TypeScript. Add a
  `tsconfig.json`, rename `vite.config.js` → `.ts` and `jsconfig.json` → `tsconfig.json`,
  convert `src/**/*.{js,jsx}` to `.ts`/`.tsx`, and type the `StudioContext` state/actions,
  tool registry, and `src/lib` function signatures. ESLint config should add the
  `typescript-eslint` toolchain.
- **Rust/WASM:** no WASM module exists yet; introduce one the first time a heavy
  processing need appears.

## Technical constraints

- All media processing must stay **in-browser** — no server calls / network deps for media.
- **Canvas encoding limits:** GIF/BMP/TIFF fall back to PNG; AVIF falls back WebP → PNG
  when unsupported; SVG is rasterized to PNG on export.
- **Max upload 25 MB**, enforced in `src/lib/imageUpload.js`.

## Dependencies of note

- React 19 / react-dom 19, react-router-dom 7, Vite 8, Tailwind 4, Vitest 4, ESLint 10.
- **`@imgly/background-removal`** (background remove): in-browser ML segmentation (IS-Net,
  ONNX Runtime + WASM). Imported dynamically so it's code-split. Bundles the ONNX Runtime
  WASM (~24 MB lazy chunk); model weights stream from IMG.LY's CDN and cache locally. An
  interim exception to the "Rust→WASM for heavy processing" policy — a battle-tested
  client-side model beat building a custom Rust/WASM segmentation pipeline. Revisit if the
  Rust/WASM toolchain matures.
- See `package.json` for exact versions.
