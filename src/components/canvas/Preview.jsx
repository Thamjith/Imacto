import { cn } from "@/lib/utils"

export function Preview({ src, alt, width, height, rotation, flipH, flipV, zoom = 100, showCropOverlay = true }) {
  const transform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
  const scale = zoom / 100
  const displayW = Math.round(240 * scale)
  const displayH = Math.max(120, Math.round((height / width) * displayW))

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
      {showCropOverlay && (
        <div className="crop-overlay">
          <div className="crop-handle" style={{ top: -4, left: -4 }} />
          <div className="crop-handle" style={{ top: -4, right: -4 }} />
          <div className="crop-handle" style={{ bottom: -4, left: -4 }} />
          <div className="crop-handle" style={{ bottom: -4, right: -4 }} />
          <div className="crop-grid-v" style={{ left: "33.33%", top: 0, bottom: 0, width: 1 }} />
          <div className="crop-grid-v" style={{ left: "66.66%", top: 0, bottom: 0, width: 1 }} />
          <div className="crop-grid-h" style={{ top: "33.33%", left: 0, right: 0, height: 1 }} />
          <div className="crop-grid-h" style={{ top: "66.66%", left: 0, right: 0, height: 1 }} />
        </div>
      )}
      <div className="preview-label">{width} × {height}</div>
    </div>
  )
}
