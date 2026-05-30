import { clampCropRegion, parseDimension } from "@/lib/cropGeometry"
import { formatFileSize } from "@/lib/imageUpload"

const FORMAT_META = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  avif: { mime: "image/avif", ext: "avif" },
  gif: { mime: "image/png", ext: "png" },
  bmp: { mime: "image/png", ext: "png" },
  tiff: { mime: "image/png", ext: "png" },
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load image for export."))
    img.src = src
  })
}

function mimeFromImage(image) {
  const mime = image.mimeType || "image/jpeg"
  if (mime === "image/svg+xml") return { mime: "image/png", ext: "png" }
  const part = mime.split("/")[1] ?? "jpeg"
  const ext = part === "jpeg" ? "jpg" : part
  return { mime, ext }
}

export function resolveOutputFormat(format, image) {
  if (format === "keep" || !format) return mimeFromImage(image)
  return FORMAT_META[format] ?? mimeFromImage(image)
}

function canvasToBlob(canvas, mime, quality) {
  const types = mime === "image/avif" ? ["image/avif", "image/webp", "image/png"] : [mime]

  return new Promise((resolve, reject) => {
    const attempt = (index) => {
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

function buildFilename(originalName, ext, suffix = "cropped") {
  const base = originalName.replace(/\.[^.]+$/, "") || "imacto-export"
  return `${base}-${suffix}.${ext}`
}

export function triggerDownload(blob, filename) {
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
export async function exportCropResize(image, cropState) {
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
export async function exportCompress(image, compressState) {
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
