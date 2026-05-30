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
/** Quality/size balanced variant (fp16) of the IS-Net segmentation model. */
export const MODEL_VARIANT = "isnet_fp16" as const
/** Rough one-time download footprint surfaced in the consent UI. */
export const MODEL_SIZE_LABEL = "~40 MB"
/** Version of the model bundled with the installed library. */
export const INSTALLED_MODEL_VERSION = LIB_VERSION

interface BgStore {
  consented: boolean
  version: string | null
  overridePath: string | null
  downloadedAt: number | null
}

export interface BgModelStatus {
  consented: boolean
  downloaded: boolean
  version: string | null
  downloadedAt: number | null
}

export interface DownloadProgress {
  phase: "fetch" | "compute"
  ratio: number
  label: string
}

function emptyStore(): BgStore {
  return { consented: false, version: null, overridePath: null, downloadedAt: null }
}

function readStore(): BgStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<BgStore>
    return {
      consented: Boolean(parsed.consented),
      version: parsed.version ?? null,
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
    downloaded: store.consented && Boolean(store.version),
    version: store.version,
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
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  const { preload } = await import("@imgly/background-removal")
  const publicPath = publicPathFor(version)
  const mapProgress = toProgress((phase) => (phase === "fetch" ? "Downloading model" : "Preparing model"))

  await preload({
    ...(publicPath ? { publicPath } : {}),
    model: MODEL_VARIANT,
    progress: (key, current, total) => onProgress?.(mapProgress(key, current, total)),
  })

  const resolved = version ?? LIB_VERSION
  writeStore({ consented: true, version: resolved, overridePath: publicPath ?? null, downloadedAt: Date.now() })
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

const BG_FILL: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
}

/**
 * Remove the image background on-device, composite the cutout onto the chosen
 * background (transparent keeps alpha), encode, and download (`-nobg` suffix).
 *
 * Uses the cached model pinned at download time so no network round-trip is
 * needed once the model has been downloaded.
 */
export async function exportBackgroundRemoval(
  image: LoadedImage,
  state: BgRemoveState,
  onProgress?: (progress: DownloadProgress) => void
): Promise<ExportResult> {
  const { removeBackground } = await import("@imgly/background-removal")
  const { overridePath } = readStore()
  const publicPath = overridePath ?? undefined
  const mapProgress = toProgress((phase) => (phase === "fetch" ? "Downloading model" : "Removing background"))

  const cutout = await removeBackground(image.objectUrl, {
    ...(publicPath ? { publicPath } : {}),
    model: MODEL_VARIANT,
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => onProgress?.(mapProgress(key, current, total)),
  })

  const cutoutUrl = URL.createObjectURL(cutout)
  try {
    const fg = await loadImageElement(cutoutUrl)

    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is not available.")

    const bg = state.bg ?? "transparent"
    const format = state.format === "webp" ? "webp" : "png"
    const mime = format === "webp" ? "image/webp" : "image/png"

    if (bg !== "transparent") {
      ctx.fillStyle = BG_FILL[bg] ?? "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
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
  } finally {
    URL.revokeObjectURL(cutoutUrl)
  }
}
