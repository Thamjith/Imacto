import { estimateKB } from "@/lib/estimate"
import { formatFileSize } from "@/lib/imageUpload"

export function EstimateRow({ quality, format, originalBytes }) {
  const hasOriginal = typeof originalBytes === "number" && originalBytes > 0
  const originalLabel = hasOriginal ? formatFileSize(originalBytes) : "2.4 MB"
  const baseKB = hasOriginal ? originalBytes / 1024 : undefined
  const estimate = estimateKB(quality, format, baseKB)

  return (
    <div className="estimate-row">
      <span>Original: {originalLabel}</span>
      <span className="estimate-good">→ est. ~{estimate} KB</span>
    </div>
  )
}
