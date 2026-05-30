const FORMAT_FACTORS: Record<string, number> = {
  keep: 0.18,
  png: 0.62,
  webp: 0.12,
  avif: 0.08,
  gif: 0.45,
  bmp: 1.6,
  tiff: 1.2,
  jpg: 0.18,
}

export function estimateKB(quality: number, format: string, baseKB = 2400): number {
  const factor = FORMAT_FACTORS[format] ?? 0.18
  return Math.round(baseKB * factor * (quality / 100))
}
