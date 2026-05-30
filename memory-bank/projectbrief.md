# Project Brief — Imacto Studio

## What it is

Imacto Studio is a **browser-based media studio** for editing images (and eventually
video) entirely on the client. All processing runs in the browser; files never leave
the user's machine.

## Core flow

**Upload → Edit → Export**

1. **Upload** — drag-and-drop or browse for a file (images today; video listed for the future).
2. **Edit** — pick a tool from the sidebar, tune settings in the right panel, preview live.
3. **Export** — encode and download the result locally with the chosen format/quality.

## Core requirements

- **100% client-side.** No backend, no env vars, no secrets, no network calls for media.
- **In-browser processing.** Use the Canvas API for light ops; use **Rust compiled to
  WebAssembly** for anything too heavy for plain JavaScript (large files, compute-bound
  pixel work, video transcoding, etc.). WASM still runs in the browser — no server.
- **TypeScript everywhere** (`.ts`/`.tsx`) — see `techContext.md` for migration status.
- **Max upload ~25 MB** per file.
- Focused, single-purpose tools rather than one monolithic editor.
- Beautiful, modern UI with good UX (shadcn-style components, Tailwind 4).

## Scope

- **Images first.** Video tools are UI placeholders (coming soon).
- Currently real: **Crop & resize** and **Compress** (both export via Canvas, download locally).
- Stubbed (UI exists, disabled): Convert, Rotate & flip, Background remove, Watermark.

## Out of scope (for now)

- Server-side processing / uploads.
- Authentication, accounts, projects, persistence/history.
- Real video processing.

## Source of truth

This file defines project scope. All other memory-bank files build on it. The
`memory-bank/` directory is the single authoritative source of project context.
