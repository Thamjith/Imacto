export function estimateKB(quality, format) {
  const baseKB = 2400
  const factor =
    { keep: 0.18, png: 0.62, webp: 0.12, avif: 0.08, gif: 0.45, bmp: 1.6, tiff: 1.2, jpg: 0.18 }[format] ?? 0.18
  return Math.round(baseKB * factor * (quality / 100))
}
