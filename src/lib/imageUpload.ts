const MAX_BYTES = 25 * 1024 * 1024

const ACCEPTED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
])

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",
  svg: "image/svg+xml",
}

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/tiff,image/svg+xml,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif,.svg"

export interface LoadedImage {
  file: File
  objectUrl: string
  width: number
  height: number
  name: string
  size: number
  sizeLabel: string
  formatLabel: string
  mimeType: string
}

export interface ValidationResult {
  ok: boolean
  error?: string
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatLabelFromFile(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    jpg: "JPG",
    jpeg: "JPG",
    png: "PNG",
    webp: "WEBP",
    avif: "AVIF",
    gif: "GIF",
    bmp: "BMP",
    tiff: "TIFF",
    tif: "TIFF",
    svg: "SVG",
  }
  return (map[ext] ?? ext.toUpperCase()) || "IMG"
}

function mimeFromFile(file: File): string | null {
  if (file.type && ACCEPTED_MIME.has(file.type)) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase()
  return ext ? (EXT_TO_MIME[ext] ?? null) : null
}

export function validateImageFile(file: File | null | undefined): ValidationResult {
  if (!file) return { ok: false, error: "No file selected." }
  if (!mimeFromFile(file))
    return { ok: false, error: "Unsupported format. Use JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, or SVG." }
  if (file.size > MAX_BYTES) return { ok: false, error: "File exceeds 25 MB limit." }
  return { ok: true }
}

export function loadImageFromFile(file: File): Promise<LoadedImage> {
  const validation = validateImageFile(file)
  if (!validation.ok) return Promise.reject(new Error(validation.error))

  const objectUrl = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        file,
        objectUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
        size: file.size,
        sizeLabel: formatFileSize(file.size),
        formatLabel: formatLabelFromFile(file),
        mimeType: file.type || mimeFromFile(file) || "",
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Could not read image. The file may be corrupted."))
    }

    img.src = objectUrl
  })
}

export function revokeImageUrl(objectUrl?: string | null): void {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
}
