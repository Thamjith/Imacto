import { formatFileSize, type LoadedImage } from "@/lib/imageUpload"
import { triggerDownload, type ExportResult } from "@/lib/imageExport"

const STORE_KEY = "imacto.bgmodel.v1"
const DATA_PKG = "@imgly/background-removal-data"
const CDN_BASE = "https://staticimgly.com"

/** Public repository for the underlying model / library. */
export const MODEL_REPO_URL = "https://github.com/imgly/background-removal-js"
/** Quality/size balanced variant (fp16) of the IS-Net segmentation model. */
export const MODEL_VARIANT = "isnet_fp16" as const
/** Rough one-time download footprint surfaced in the consent UI. */
export const MODEL_SIZE_LABEL = "~40 MB"

interface BgStore {
  consented: boolean
  version: string | null
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

function readStore(): BgStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { consented: false, version: null, downloadedAt: null }
    const parsed = JSON.parse(raw) as Partial<BgStore>
    return {
      consented: Boolean(parsed.consented),
      version: parsed.version ?? null,
      downloadedAt: parsed.downloadedAt ?? null,
    }
  } catch {
    return { consented: false, version: null, downloadedAt: null }
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
  writeStore({ consented: false, version: null, downloadedAt: null })
}

/**
 * Best-effort lookup of the latest published model-data version on npm. Returns
 * null when offline or the registry is unreachable (callers fall back to the
 * version bundled with the installed library).
 */
export async function fetchLatestModelVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${DATA_PKG}/latest`, { cache: "no-store" })
    if (!res.ok) return null
    const json = (await res.json()) as { version?: unknown }
    return typeof json.version === "string" ? json.version : null
  } catch {
    return null
  }
}

function publicPathFor(version: string | null): string | undefined {
  return version ? `${CDN_BASE}/${DATA_PKG}/${version}/dist/` : undefined
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

  const resolved = version ?? "bundled"
  writeStore({ consented: true, version: resolved, downloadedAt: Date.now() })
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
  const { version } = readStore()
  const publicPath = publicPathFor(version)
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
