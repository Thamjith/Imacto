import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react"
import {
  aspectRatioFromLabel,
  displayToRegion,
  imageDisplayRect,
  regionToDisplay,
  resizeRegionFromHandle,
  type Box,
  type CropHandle,
} from "@/lib/cropGeometry"

const HANDLES: Array<Exclude<CropHandle, "move">> = ["nw", "ne", "sw", "se"]

interface DragState {
  handle: CropHandle
  startX: number
  startY: number
  startRegion: Box
}

interface CropOverlayProps {
  containerW: number
  containerH: number
  imageW: number
  imageH: number
  region: Box
  aspect: string
  onRegionChange: (region: Box) => void
}

export function CropOverlay({
  containerW,
  containerH,
  imageW,
  imageH,
  region,
  aspect,
  onRegionChange,
}: CropOverlayProps) {
  const dragRef = useRef<DragState | null>(null)
  const onRegionChangeRef = useRef(onRegionChange)

  useEffect(() => {
    onRegionChangeRef.current = onRegionChange
  }, [onRegionChange])

  const displayRect = imageDisplayRect(containerW, containerH, imageW, imageH)
  const box = regionToDisplay(region, displayRect, imageW, imageH)
  const aspectLock = aspectRatioFromLabel(aspect)

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      const scaleX = imageW / displayRect.width
      const scaleY = imageH / displayRect.height
      const dx = (e.clientX - drag.startX) * scaleX
      const dy = (e.clientY - drag.startY) * scaleY

      let next = drag.startRegion
      if (drag.handle === "move") {
        next = resizeRegionFromHandle(next, "move", dx, dy, imageW, imageH, null)
      } else {
        next = resizeRegionFromHandle(drag.startRegion, drag.handle, dx, dy, imageW, imageH, aspectLock)
      }

      onRegionChangeRef.current(next)
    }

    const onPointerUp = () => {
      dragRef.current = null
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [aspectLock, displayRect.width, displayRect.height, imageW, imageH])

  const startDrag = (handle: CropHandle) => (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRegion: { ...region },
    }
  }

  const onOverlayPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).dataset.handle) return
    const layer = (e.currentTarget as HTMLElement).parentElement
    if (!layer) return
    const layerRect = layer.getBoundingClientRect()
    const localX = e.clientX - layerRect.left
    const localY = e.clientY - layerRect.top
    const display = {
      x: localX - box.width / 2,
      y: localY - box.height / 2,
      width: box.width,
      height: box.height,
    }
    const nextRegion = displayToRegion(display, displayRect, imageW, imageH)
    onRegionChangeRef.current(nextRegion)
    dragRef.current = {
      handle: "move",
      startX: e.clientX,
      startY: e.clientY,
      startRegion: nextRegion,
    }
  }

  return (
    <div className="crop-layer" style={{ width: containerW, height: containerH }}>
      <div className="crop-shade crop-shade-top" style={{ height: Math.max(0, box.y) }} />
      <div
        className="crop-shade crop-shade-side"
        style={{ top: box.y, width: Math.max(0, box.x), height: box.height }}
      />
      <div
        className="crop-shade crop-shade-side"
        style={{
          top: box.y,
          left: box.x + box.width,
          right: 0,
          height: box.height,
        }}
      />
      <div className="crop-shade crop-shade-bottom" style={{ top: box.y + box.height }} />
      <div
        className="crop-overlay crop-overlay-interactive"
        style={{
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
        }}
        onPointerDown={onOverlayPointerDown}
      >
        <div className="crop-grid-v" style={{ left: "33.33%", top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-v" style={{ left: "66.66%", top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-h" style={{ top: "33.33%", left: 0, right: 0, height: 1 }} />
        <div className="crop-grid-h" style={{ top: "66.66%", left: 0, right: 0, height: 1 }} />
        {HANDLES.map((handle) => (
          <div
            key={handle}
            className={`crop-handle crop-handle-${handle}`}
            data-handle={handle}
            onPointerDown={startDrag(handle)}
          />
        ))}
      </div>
    </div>
  )
}
