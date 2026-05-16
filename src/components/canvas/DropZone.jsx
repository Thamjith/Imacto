import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const FORMATS = ["JPG", "PNG", "WEBP", "AVIF", "MP4", "MOV"]

export function DropZone({ onLoad }) {
  const [dragover, setDragover] = useState(false)

  return (
    <div
      className={cn("drop-card", dragover && "dragover")}
      onDragOver={(e) => {
        e.preventDefault()
        setDragover(true)
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragover(false)
        onLoad()
      }}
      onClick={onLoad}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onLoad()}
    >
      <div className="drop-icon">
        <i className="ti ti-cloud-upload" />
      </div>
      <div className="drop-title">Drop your file here</div>
      <div className="drop-sub">or click to browse</div>
      <div className="format-pills">
        {FORMATS.map((f) => (
          <Badge key={f} variant="secondary" className="format-pill font-mono text-[10px] font-normal">
            {f}
          </Badge>
        ))}
      </div>
    </div>
  )
}
