import { type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { DropZone } from "./DropZone"
import { Preview } from "./Preview"
import { type BrushMode, type CropToolState } from "@/constants/tools"
import { type BgBrush } from "@/hooks/useBgBrush"
import { type BgPreviewState } from "@/context/StudioContext"
import { type LoadedImage } from "@/lib/imageUpload"
import { type Box } from "@/lib/cropGeometry"

interface CanvasProps {
  loaded: boolean
  image: LoadedImage | null
  onFile: (file: File) => void
  uploadError: string | null
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  rotation: number
  flipH: boolean
  flipV: boolean
  undo: () => void
  showCropOverlay: boolean
  cropState: CropToolState
  onCropRegionChange: (region: Box) => void
  bgRemoveActive?: boolean
  bgPreview: BgPreviewState
  bgFill: string
  bgBrush: BgBrush
  brushMode?: BrushMode
  brushSize?: number
}

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
  bgBrush,
  brushMode = "off",
  brushSize = 28,
}: CanvasProps) {
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
    cropState.region.width > 0
      ? cropState.region
      : { x: 0, y: 0, width: image.width, height: image.height }

  const bgPreviewReady = bgRemoveActive && bgPreview?.status === "ready" && bgPreview?.url
  const previewSrc = bgPreviewReady ? bgBrush?.editedUrl ?? bgPreview.url : image.objectUrl
  const brushActive = bgRemoveActive && brushMode !== "off"

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
            brushActive={brushActive}
            brushMode={brushMode}
            brushSize={brushSize}
            brush={bgBrush}
          />
          <div className="meta-row">
            <span>
              {Math.round(region.width)} × {Math.round(region.height)}
              {showCropOverlay ? ` → ${cropState?.width} × ${cropState?.height}` : ` · ${image.width} × ${image.height}`}
            </span>
            <span className="sep" />
            <span>{zoom}%</span>
            <span className="sep" />
            <span>{image.formatLabel} · sRGB</span>
          </div>
        </div>
      </div>
      <div className="canvas-tools">
        {brushActive ? (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => bgBrush?.undo()}
              disabled={!bgBrush?.canUndo}
              title="Undo brush stroke"
            >
              <i className="ti ti-arrow-back-up" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => bgBrush?.redo()}
              disabled={!bgBrush?.canRedo}
              title="Redo brush stroke"
            >
              <i className="ti ti-arrow-forward-up" />
            </Button>
            <span className="canvas-tools-sep" />
          </>
        ) : null}
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
