import { estimateKB } from "@/lib/estimate"

export function EstimateRow({ quality, format }) {
  return (
    <div className="estimate-row">
      <span>Original: 2.4 MB</span>
      <span className="estimate-good">→ est. ~{estimateKB(quality, format)} KB</span>
    </div>
  )
}
