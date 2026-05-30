import { clampCropRegion, parseDimension, type Box } from "@/lib/cropGeometry"
import { formatFileSize, type LoadedImage } from "@/lib/imageUpload"

interface FormatMeta {
  mime: string
  ext: string
}

interface EncodedBlob {
  blob: Blob
  mime: string
  ext: string
}

export interface RotateState {
  rotation?: number
  flipH?: boolean
  flipV?: boolean
  format?: string
  bg?: string
}

export interface ExportResult {
  filename: string
  size: number
  sizeLabel: string
  width: number
  height: number
}

export interface CropState {
  region?: Box
  width?: number | string
  height?: number | string
  format?: string
  quality?: number
}

export interface CompressState {
  quality?: number
}

export interface ConvertState {
  format?: string
  profile?: string
  bg?: string
}

const FORMAT_META: Record<string, FormatMeta> = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  avif: { mime: "image/avif", ext: "avif" },
  gif: { mime: "image/png", ext: "png" },
  bmp: { mime: "image/png", ext: "png" },
  tiff: { mime: "image/png", ext: "png" },
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load image for export."))
    img.src = src
  })
}

function mimeFromImage(image: LoadedImage): FormatMeta {
  const mime = image.mimeType || "image/jpeg"
  if (mime === "image/svg+xml") return { mime: "image/png", ext: "png" }
  const part = mime.split("/")[1] ?? "jpeg"
  const ext = part === "jpeg" ? "jpg" : part
  return { mime, ext }
}

export function resolveOutputFormat(format: string | undefined, image: LoadedImage): FormatMeta {
  if (format === "keep" || !format) return mimeFromImage(image)
  return FORMAT_META[format] ?? mimeFromImage(image)
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<EncodedBlob> {
  const types = mime === "image/avif" ? ["image/avif", "image/webp", "image/png"] : [mime]

  return new Promise((resolve, reject) => {
    const attempt = (index: number) => {
      const type = types[index]
      if (!type) {
        reject(new Error("Export failed: format not supported in this browser."))
        return
      }
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const ext =
              type === "image/jpeg"
                ? "jpg"
                : type === "image/webp" && mime === "image/avif"
                  ? "webp"
                  : type.split("/")[1] === "jpeg"
                    ? "jpg"
                    : type.split("/")[1]
            resolve({ blob, mime: type, ext })
            return
          }
          attempt(index + 1)
        },
        type,
        quality
      )
    }
    attempt(0)
  })
}

function buildFilename(originalName: string, ext: string, suffix = "cropped"): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "imacto-export"
  return `${base}-${suffix}.${ext}`
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Crop source region and scale to output dimensions, then encode.
 */
export async function exportCropResize(image: LoadedImage, cropState: CropState): Promise<ExportResult> {
  const img = await loadImageElement(image.objectUrl)
  const region = clampCropRegion(
    cropState.region ?? { x: 0, y: 0, width: image.width, height: image.height },
    image.width,
    image.height
  )
  const outW = parseDimension(cropState.width, region.width)
  const outH = parseDimension(cropState.height, region.height)

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available.")

  ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, outW, outH)

  const { mime, ext: preferredExt } = resolveOutputFormat(cropState.format, image)
  const quality = Math.min(1, Math.max(0.1, (cropState.quality ?? 85) / 100))
  const useQuality = mime === "image/jpeg" || mime === "image/webp" || mime === "image/avif"

  const { blob, ext: encodedExt } = await canvasToBlob(canvas, mime, useQuality ? quality : undefined)
  const filename = buildFilename(image.name, encodedExt ?? preferredExt)

  triggerDownload(blob, filename)

  return {
    filename,
    size: blob.size,
    sizeLabel: formatFileSize(blob.size),
    width: outW,
    height: outH,
  }
}

/**
 * Re-encode the image at full resolution to reduce file size.
 *
 * Quality applies to lossy formats (JPEG/WebP/AVIF). Lossless PNG keeps its
 * format but is re-encoded through the canvas, which also strips EXIF metadata.
 */
export async function exportCompress(image: LoadedImage, compressState: CompressState): Promise<ExportResult> {
  const img = await loadImageElement(image.objectUrl)

  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available.")

  ctx.drawImage(img, 0, 0, image.width, image.height)

  const { mime, ext: preferredExt } = resolveOutputFormat("keep", image)
  const quality = Math.min(1, Math.max(0.1, (compressState.quality ?? 80) / 100))
  const useQuality = mime === "image/jpeg" || mime === "image/webp" || mime === "image/avif"

  const { blob, ext: encodedExt } = await canvasToBlob(canvas, mime, useQuality ? quality : undefined)
  const filename = buildFilename(image.name, encodedExt ?? preferredExt, "compressed")

  triggerDownload(blob, filename)

  return {
    filename,
    size: blob.size,
    sizeLabel: formatFileSize(blob.size),
    width: image.width,
    height: image.height,
  }
}

const BG_FILL: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
}

/**
 * Re-encode the image at full resolution into a different container format.
 *
 * Formats without an alpha channel (e.g. JPEG) are flattened onto the chosen
 * background color so transparent regions don't turn black. Lossy formats are
 * encoded at high quality since conversion is about format, not compression.
 */
export async function exportConvert(image: LoadedImage, convertState: ConvertState): Promise<ExportResult> {
  const img = await loadImageElement(image.objectUrl)

  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available.")

  const { mime, ext: preferredExt } = resolveOutputFormat(convertState.format, image)
  const supportsAlpha = mime === "image/png" || mime === "image/webp" || mime === "image/avif"
  const bg = convertState.bg ?? "white"

  // Flatten onto a solid background when the target can't store alpha, or when
  // the user explicitly picks a solid color over transparency.
  if (!supportsAlpha || bg !== "transparent") {
    ctx.fillStyle = BG_FILL[bg] ?? "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0, image.width, image.height)

  const useQuality = mime === "image/jpeg" || mime === "image/webp" || mime === "image/avif"
  const { blob, ext: encodedExt } = await canvasToBlob(canvas, mime, useQuality ? 0.92 : undefined)
  const filename = buildFilename(image.name, encodedExt ?? preferredExt, "converted")

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
 * Rotate the image by an arbitrary angle and/or flip it, then encode.
 *
 * The output canvas is sized to the rotated bounding box so corners are never
 * clipped. Formats without an alpha channel (e.g. JPEG) are flattened onto a
 * solid background because rotation by a non-right angle exposes transparent
 * corners that would otherwise encode as black.
 */
export async function exportRotateFlip(image: LoadedImage, rotateState: RotateState): Promise<ExportResult> {
  const img = await loadImageElement(image.objectUrl)

  const angle = (((rotateState.rotation ?? 0) % 360) + 360) % 360
  const rad = (angle * Math.PI) / 180
  const flipH = rotateState.flipH ? -1 : 1
  const flipV = rotateState.flipV ? -1 : 1

  const w = image.width
  const h = image.height
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const outW = Math.max(1, Math.round(w * cos + h * sin))
  const outH = Math.max(1, Math.round(w * sin + h * cos))

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available.")

  const { mime, ext: preferredExt } = resolveOutputFormat(rotateState.format, image)
  const supportsAlpha = mime === "image/png" || mime === "image/webp" || mime === "image/avif"
  if (!supportsAlpha) {
    ctx.fillStyle = BG_FILL[rotateState.bg ?? "white"] ?? "#ffffff"
    ctx.fillRect(0, 0, outW, outH)
  }

  // Move origin to the canvas center, then rotate and flip about it before
  // drawing the (centered) source image.
  ctx.translate(outW / 2, outH / 2)
  ctx.rotate(rad)
  ctx.scale(flipH, flipV)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)

  const useQuality = mime === "image/jpeg" || mime === "image/webp" || mime === "image/avif"
  const { blob, ext: encodedExt } = await canvasToBlob(canvas, mime, useQuality ? 0.92 : undefined)
  const filename = buildFilename(image.name, encodedExt ?? preferredExt, "rotated")

  triggerDownload(blob, filename)

  return {
    filename,
    size: blob.size,
    sizeLabel: formatFileSize(blob.size),
    width: outW,
    height: outH,
  }
}
