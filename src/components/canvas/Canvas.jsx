import { Button } from "@/components/ui/button"
import { DropZone } from "./DropZone"
import { Preview } from "./Preview"

export function Canvas({ loaded, onLoad, zoom, setZoom, rotation, flipH, flipV, undo }) {
  if (!loaded) {
    return (
      <div className="canvas">
        <DropZone onLoad={onLoad} />
        <div className="hint-row">
          <i className="ti ti-info-circle" />
          <span>max 25 MB · processed locally in your browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className="canvas">
      <div className="preview-wrap">
        <Preview rotation={rotation} flipH={flipH} flipV={flipV} />
        <div className="meta-row">
          <span>1920 × 1080</span>
          <span className="sep" />
          <span>{zoom}%</span>
          <span className="sep" />
          <span>JPG · sRGB</span>
        </div>
        <div className="canvas-tools">
          <Button variant="outline" size="icon-sm" onClick={() => setZoom((z) => Math.min(400, z + 25))} title="Zoom in">
            <i className="ti ti-zoom-in" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setZoom((z) => Math.max(25, z - 25))} title="Zoom out">
            <i className="ti ti-zoom-out" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(100)}>
            <i className="ti ti-maximize" />
            <span>Fit</span>
          </Button>
          <Button variant="outline" size="sm" onClick={undo}>
            <i className="ti ti-arrow-back-up" />
            <span>Undo</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
