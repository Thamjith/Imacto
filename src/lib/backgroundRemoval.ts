import { formatFileSize, type LoadedImage } from "@/lib/imageUpload"
import { triggerDownload, type ExportResult } from "@/lib/imageExport"

const STORE_KEY = "imacto.bgmodel.v2"
const LIB_PKG = "@imgly/background-removal"
const DATA_DIR = "@imgly/background-removal-data"
const CDN_BASE = "https://staticimgly.com"

// IMPORTANT: the model assets on the CDN are versioned by the *library* version
// (the default publicPath is `.../background-removal-data/<LIB_VERSION>/dist/`),
// NOT by the @imgly/background-removal-data npm version. Keep this in sync with
// the installed @imgly/background-removal version in package.json.
const LIB_VERSION = "1.7.0"

/** Public repository for the underlying model / library. */
export const MODEL_REPO_URL = "https://github.com/imgly/background-removal-js"
/** Version of the model bundled with the installed library. */
export const INSTALLED_MODEL_VERSION = LIB_VERSION

export type ModelVariant = "isnet" | "isnet_fp16" | "isnet_quint8"

export interface ModelOption {
  id: ModelVariant
  label: string
  size: string
  hint: string
}

/**
 * The three IS-Net variants the library can load. These are the only models
 * `@imgly/background-removal` supports via its `model` config — arbitrary
 * external ONNX models would need a custom inference pipeline (not supported).
 */
export const MODEL_OPTIONS: ModelOption[] = [
  { id: "isnet", label: "Best", size: "~80 MB", hint: "Full IS-Net — sharpest edges, slowest" },
  { id: "isnet_fp16", label: "Balanced", size: "~40 MB", hint: "Half-precision — good quality, faster" },
  { id: "isnet_quint8", label: "Fast", size: "~20 MB", hint: "Quantized — fastest, lower quality" },
]

/** Best-quality variant is the default per the user's request. */
export const DEFAULT_MODEL: ModelVariant = "isnet"

export function modelSize(variant: string | null | undefined): string {
  return MODEL_OPTIONS.find((m) => m.id === variant)?.size ?? "~80 MB"
}

interface BgStore {
  consented: boolean
  version: string | null
  variant: ModelVariant | null
  overridePath: string | null
  downloadedAt: number | null
}

export interface BgModelStatus {
  consented: boolean
  downloaded: boolean
  version: string | null
  variant: ModelVariant | null
  downloadedAt: number | null
}

export interface DownloadProgress {
  phase: "fetch" | "compute"
  ratio: number
  label: string
}

function emptyStore(): BgStore {
  return { consented: false, version: null, variant: null, overridePath: null, downloadedAt: null }
}

function readStore(): BgStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<BgStore>
    return {
      consented: Boolean(parsed.consented),
      version: parsed.version ?? null,
      variant: parsed.variant ?? null,
      overridePath: parsed.overridePath ?? null,
      downloadedAt: parsed.downloadedAt ?? null,
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: BgStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // Storage may be unavailable (private mode); model still works for the session.
  }
}

export function getModelStatus(): BgModelStatus {
  const store = readStore()
  return {
    consented: store.consented,
    downloaded: store.consented && Boolean(store.version) && Boolean(store.variant),
    version: store.version,
    variant: store.variant,
    downloadedAt: store.downloadedAt,
  }
}

/** Forget consent + cached version so the consent gate reappears. */
export function forgetModel(): void {
  writeStore(emptyStore())
}

/**
 * Best-effort lookup of the latest published *library* version on npm. The CDN
 * model assets are versioned by the library version, so this is the value that
 * determines whether a newer model exists. Returns null when offline.
 */
export async function fetchLatestModelVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${LIB_PKG}/latest`, { cache: "no-store" })
    if (!res.ok) return null
    const json = (await res.json()) as { version?: unknown }
    return typeof json.version === "string" ? json.version : null
  } catch {
    return null
  }
}

/**
 * publicPath for a non-default (newer) library version, or undefined to use the
 * library's built-in default (the version it shipped with — always compatible).
 */
function publicPathFor(version: string | null): string | undefined {
  if (!version || version === LIB_VERSION) return undefined
  return `${CDN_BASE}/${DATA_DIR}/${version}/dist/`
}

function toProgress(label: (phase: "fetch" | "compute") => string) {
  return (key: string, current: number, total: number): DownloadProgress => {
    const phase: "fetch" | "compute" = key.startsWith("fetch") ? "fetch" : "compute"
    return { phase, ratio: total > 0 ? current / total : 0, label: label(phase) }
  }
}

/**
 * Download (and cache, via the browser Cache Storage) the segmentation model.
 *
 * Pass an explicit `version` to pin the model-data release used; pass null to
 * use the version bundled with the installed library. Records consent + the
 * resolved version so the consent gate doesn't reappear on future visits.
 */
export async function downloadModel(
  version: string | null,
  variant: ModelVariant,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  const { preload } = await import("@imgly/background-removal")
  const publicPath = publicPathFor(version)
  const mapProgress = toProgress((phase) => (phase === "fetch" ? "Downloading model" : "Preparing model"))

  await preload({
    ...(publicPath ? { publicPath } : {}),
    model: variant,
    progress: (key, current, total) => onProgress?.(mapProgress(key, current, total)),
  })

  const resolved = version ?? LIB_VERSION
  writeStore({
    consented: true,
    version: resolved,
    variant,
    overridePath: publicPath ?? null,
    downloadedAt: Date.now(),
  })
  return resolved
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load the processed image."))
    img.src = src
  })
}

export interface BgRemoveState {
  bg?: string
  format?: string
}

/**
 * Run the segmentation model on the image and return the transparent cutout as
 * a Blob. Uses the cached variant + version pinned at download time, so no
 * network round-trip is needed once the model is downloaded.
 */
export async function runSegmentation(
  image: LoadedImage,
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal")
  const { overridePath, variant } = readStore()
  const publicPath = overridePath ?? undefined
  const mapProgress = toProgress((phase) => (phase === "fetch" ? "Downloading model" : "Removing background"))

  return removeBackground(image.objectUrl, {
    ...(publicPath ? { publicPath } : {}),
    model: variant ?? DEFAULT_MODEL,
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => onProgress?.(mapProgress(key, current, total)),
  })
}

/** Produce a transparent-cutout object URL for live preview. Caller revokes it. */
export async function previewBackgroundRemoval(
  image: LoadedImage,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  const cutout = await runSegmentation(image, onProgress)
  return URL.createObjectURL(cutout)
}

function paintBackground(ctx: CanvasRenderingContext2D, bg: string, w: number, h: number): void {
  if (bg === "transparent") return
  if (bg === "blur") {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, "#5a6cf5")
    grad.addColorStop(1, "#22b5a8")
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = bg === "black" ? "#000000" : "#ffffff"
  }
  ctx.fillRect(0, 0, w, h)
}

/**
 * Composite an already-computed transparent cutout onto the chosen background,
 * encode (PNG/WebP), and download (`-nobg` suffix). Reused by both the export
 * path and (via `exportBackgroundRemoval`) the no-preview fallback.
 */
export async function composeBackgroundRemoval(
  cutoutUrl: string,
  image: LoadedImage,
  state: BgRemoveState
): Promise<ExportResult> {
  const fg = await loadImageElement(cutoutUrl)

  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available.")

  const bg = state.bg ?? "transparent"
  const format = state.format === "webp" ? "webp" : "png"
  const mime = format === "webp" ? "image/webp" : "image/png"

  paintBackground(ctx, bg, canvas.width, canvas.height)
  ctx.drawImage(fg, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Export failed: could not encode image."))),
      mime,
      format === "webp" ? 0.92 : undefined
    )
  })

  const base = image.name.replace(/\.[^.]+$/, "") || "imacto-export"
  const filename = `${base}-nobg.${format}`
  triggerDownload(blob, filename)

  return {
    filename,
    size: blob.size,
    sizeLabel: formatFileSize(blob.size),
    width: image.width,
    height: image.height,
  }
}

/**
 * Full pipeline: segment the image, then composite + encode + download. Used
 * when no live-preview cutout is available to reuse.
 */
export async function exportBackgroundRemoval(
  image: LoadedImage,
  state: BgRemoveState,
  onProgress?: (progress: DownloadProgress) => void
): Promise<ExportResult> {
  const cutoutUrl = await previewBackgroundRemoval(image, onProgress)
  try {
    return await composeBackgroundRemoval(cutoutUrl, image, state)
  } finally {
    URL.revokeObjectURL(cutoutUrl)
  }
}
