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
- **In-browser processing** via the Canvas API (`toBlob`); no WASM yet.
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
