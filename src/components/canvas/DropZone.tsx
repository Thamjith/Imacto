import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { IMAGE_ACCEPT } from "@/lib/imageUpload"
import { cn } from "@/lib/utils"

const FORMATS = ["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP"]

function pickImageFile(fileList: FileList | null): File | null {
  if (!fileList?.length) return null
  return (
    Array.from(fileList).find(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|svg)$/i.test(f.name)
    ) ?? null
  )
}

interface DropZoneProps {
  onFile: (file: File) => void
  error?: string | null
}

export function DropZone({ onFile, error }: DropZoneProps) {
  const [dragover, setDragover] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (fileList: FileList | null) => {
    const file = pickImageFile(fileList)
    if (file) onFile(file)
  }

  return (
    <div className="drop-zone-wrap">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
      <div
        className={cn("drop-card", dragover && "dragover", error && "drop-card-error")}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setDragover(true)
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setDragover(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <div className="drop-icon">
          <i className="ti ti-cloud-upload" />
        </div>
        <div className="drop-title">Drop your image here</div>
        <div className="drop-sub">or click to browse</div>
        <div className="format-pills">
          {FORMATS.map((f) => (
            <Badge key={f} variant="secondary" className="format-pill font-mono text-[10px] font-normal">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      {error ? <p className="drop-error">{error}</p> : null}
    </div>
  )
}
