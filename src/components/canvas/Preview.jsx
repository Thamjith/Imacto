import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { CropOverlay } from "./CropOverlay"

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
}) {
  const transform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
  const scale = zoom / 100
  const displayW = Math.round(240 * scale)
  const displayH = Math.max(120, Math.round((sourceHeight / sourceWidth) * displayW))

  const label = useMemo(() => {
    if (showCropOverlay && cropRegion) {
      return `${Math.round(cropRegion.width)} × ${Math.round(cropRegion.height)} → ${outputWidth} × ${outputHeight}`
    }
    return `${outputWidth} × ${outputHeight}`
  }, [showCropOverlay, cropRegion, outputWidth, outputHeight])

  return (
    <div
      className={cn("preview", src && "preview-has-image")}
      style={{
        width: displayW,
        height: displayH,
        transform,
        transition: "transform 220ms ease, width 120ms ease, height 120ms ease",
      }}
    >
      {src ? (
        <img src={src} alt={alt} className="preview-image" draggable={false} />
      ) : null}
      {showCropOverlay && cropRegion && onCropRegionChange ? (
        <CropOverlay
          containerW={displayW}
          containerH={displayH}
          imageW={sourceWidth}
          imageH={sourceHeight}
          region={cropRegion}
          aspect={cropAspect}
          onRegionChange={onCropRegionChange}
        />
      ) : null}
      <div className="preview-label">{label}</div>
    </div>
  )
}
