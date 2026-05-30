import { useMemo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { CropOverlay } from "./CropOverlay"
import { BgBrushCanvas } from "./BgBrushCanvas"
import { type BrushMode } from "@/constants/tools"
import { type BgBrush } from "@/hooks/useBgBrush"
import { type Box } from "@/lib/cropGeometry"

function bgFillStyle(bgFill: string | null): CSSProperties {
  switch (bgFill) {
    case "white":
      return { background: "#ffffff" }
    case "black":
      return { background: "#000000" }
    case "blur":
      return { background: "linear-gradient(135deg,#5a6cf5,#22b5a8)" }
    default:
      return {}
  }
}

interface PreviewProps {
  src?: string | null
  alt?: string
  sourceWidth: number
  sourceHeight: number
  outputWidth: number | string
  outputHeight: number | string
  rotation: number
  flipH: boolean
  flipV: boolean
  zoom?: number
  showCropOverlay?: boolean
  cropRegion?: Box | null
  cropAspect?: string
  onCropRegionChange?: (region: Box) => void
  bgFill?: string | null
  processing?: boolean
  brushActive?: boolean
  brushMode?: BrushMode
  brushSize?: number
  brush?: BgBrush | null
}

export function Preview({
  src,
  alt,
  sourceWidth,
  sourceHeight,
  outputWidth,
  outputHeight,
  rotation,
  flipH,
  flipV,
  zoom = 100,
  showCropOverlay = false,
  cropRegion,
  cropAspect,
  onCropRegionChange,
  bgFill = null,
  processing = false,
  brushActive = false,
  brushMode = "off",
  brushSize = 28,
  brush = null,
}: PreviewProps) {
  const transform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
  const scale = zoom / 100
  const displayW = Math.round(240 * scale)
  const displayH = Math.max(120, Math.round((sourceHeight / sourceWidth) * displayW))

  const fillStyle = bgFillStyle(bgFill)
  const showBrush = brushActive && brushMode !== "off" && brush?.ready

  const label = useMemo(() => {
    if (showCropOverlay && cropRegion) {
      return `${Math.round(cropRegion.width)} × ${Math.round(cropRegion.height)} → ${outputWidth} × ${outputHeight}`
    }
    return `${outputWidth} × ${outputHeight}`
  }, [showCropOverlay, cropRegion, outputWidth, outputHeight])

  return (
    <div
      className={cn("preview", src && "preview-has-image", bgFill === "transparent" && "preview-checker")}
      style={{
        width: displayW,
        height: displayH,
        transform,
        transition: "transform 220ms ease, width 120ms ease, height 120ms ease",
        ...fillStyle,
      }}
    >
      {showBrush && brush ? (
        <BgBrushCanvas
          displayW={displayW}
          displayH={displayH}
          sourceWidth={sourceWidth}
          sourceHeight={sourceHeight}
          bgFill={bgFill}
          mode={brushMode}
          brushSize={brushSize}
          brush={brush}
        />
      ) : src ? (
        <img src={src} alt={alt} className="preview-image" draggable={false} />
      ) : null}
      {processing ? (
        <div className="preview-processing">
          <i className="ti ti-loader-2 spin" />
          <span>Removing background…</span>
        </div>
      ) : null}
      {showCropOverlay && cropRegion && onCropRegionChange ? (
        <CropOverlay
          containerW={displayW}
          containerH={displayH}
          imageW={sourceWidth}
          imageH={sourceHeight}
          region={cropRegion}
          aspect={cropAspect ?? "Free"}
          onRegionChange={onCropRegionChange}
        />
      ) : null}
      <div className="preview-label">{label}</div>
    </div>
  )
}
