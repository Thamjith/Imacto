import { Button } from "@/components/ui/button"
import { DropZone } from "./DropZone"
import { Preview } from "./Preview"

export function Canvas({
  loaded,
  image,
  onFile,
  uploadError,
  zoom,
  setZoom,
  rotation,
  flipH,
  flipV,
  undo,
  showCropOverlay,
  cropState,
  onCropRegionChange,
  bgRemoveActive = false,
  bgPreview,
  bgFill,
}) {
  if (!loaded || !image) {
    return (
      <div className="canvas">
        <DropZone onFile={onFile} error={uploadError} />
        <div className="hint-row">
          <i className="ti ti-info-circle" />
          <span>max 25 MB · processed locally in your browser</span>
        </div>
      </div>
    )
  }

  const region =
    cropState?.region?.width > 0
      ? cropState.region
      : { x: 0, y: 0, width: image.width, height: image.height }

  const bgPreviewReady = bgRemoveActive && bgPreview?.status === "ready" && bgPreview?.url
  const previewSrc = bgPreviewReady ? bgPreview.url : image.objectUrl

  return (
    <div className="canvas">
      <div className="canvas-scroll">
        <div className="preview-wrap">
        <Preview
          src={previewSrc}
          alt={image.name}
          sourceWidth={image.width}
          sourceHeight={image.height}
          outputWidth={cropState?.width ?? image.width}
          outputHeight={cropState?.height ?? image.height}
          rotation={rotation}
          flipH={flipH}
          flipV={flipV}
          zoom={zoom}
          showCropOverlay={showCropOverlay}
          cropRegion={region}
          cropAspect={cropState?.aspect}
          onCropRegionChange={onCropRegionChange}
          bgFill={bgRemoveActive ? bgFill : null}
          processing={bgRemoveActive && bgPreview?.status === "processing"}
        />
          <div className="meta-row">
            <span>
              {Math.round(region.width)} × {Math.round(region.height)}
              {showCropOverlay ? ` → ${cropState?.width} × ${cropState?.height}` : ` · ${image.width} × ${image.height}`}
            </span>
            <span className="sep" />
            <span>{zoom}%</span>
            <span className="sep" />
            <span>
              {image.formatLabel} · sRGB
            </span>
          </div>
        </div>
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
          <span>Clear</span>
        </Button>
      </div>
    </div>
  )
}
