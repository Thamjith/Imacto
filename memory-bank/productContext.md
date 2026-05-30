# Product Context — Imacto Studio

## Why this project exists

People constantly need quick, focused image edits — crop, resize, compress, convert —
but common options are either heavyweight desktop apps or web tools that upload files to
a server (privacy and speed concerns). Imacto solves this by doing **everything locally
in the browser**: fast, private, no account, no upload.

## Problems it solves

- **Privacy:** files stay on the user's machine; nothing is sent to a server.
- **Friction:** no sign-up, no install — open the page and edit.
- **Focus:** one clear tool at a time instead of an overwhelming editor.
- **Speed:** Canvas-based processing happens instantly, client-side.

## How it should work (UX)

- Land on the studio → default to the **Crop & resize** tool (`/crop`).
- A persistent **left sidebar** lists image tools (and a "coming soon" video group).
  Disabled tools show a "Coming soon" tooltip.
- The **center stage** shows the upload drop zone, then a live preview of the image with
  interactive overlays (e.g. crop handles).
- The **right panel** holds the active tool's settings (aspect, dimensions, quality,
  format, etc.) plus an output-size estimate.
- A **top bar / stage bar** reflects the current step (`upload` → `edit` → `export`).
- Export queues a real local download; a toast confirms completion.

## User experience goals

- Immediate, obvious flow: Upload → Edit → Export.
- Live preview that matches the exported result.
- Sensible defaults so a user can export without fiddling.
- Clear feedback: toasts for success, inline errors for bad uploads (size/type),
  disabled/“soon” states for unfinished tools.
- Trust: it's always clear that files stay local.
