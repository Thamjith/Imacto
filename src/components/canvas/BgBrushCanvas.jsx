import { useCallback, useEffect, useRef, useState } from "react"

function paintFill(ctx, bgFill, w, h) {
  if (!bgFill || bgFill === "transparent") return
  if (bgFill === "blur") {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, "#5a6cf5")
    grad.addColorStop(1, "#22b5a8")
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = bgFill === "black" ? "#000000" : "#ffffff"
  }
  ctx.fillRect(0, 0, w, h)
}

/**
 * Interactive brush layer for the Background Remove tool. Renders the brush
 * controller's work canvas scaled to the preview size (over the chosen
 * background) and forwards pointer strokes (mapped display -> source) to the
 * controller for erase/restore painting.
 */
export function BgBrushCanvas({ displayW, displayH, sourceWidth, sourceHeight, bgFill, mode, brushSize, brush }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false })

  const ratio = sourceWidth / displayW

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const work = brush.getWorkCanvas()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, displayW, displayH)
    paintFill(ctx, bgFill, displayW, displayH)
    if (work) ctx.drawImage(work, 0, 0, displayW, displayH)
  }, [brush, bgFill, displayW, displayH])

  useEffect(() => {
    redraw()
  }, [redraw, brush.version])

  const toSource = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    return { lx, ly, sx: lx * ratio, sy: ly * (sourceHeight / displayH) }
  }

  const onPointerDown = (e) => {
    if (mode === "off") return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drawingRef.current = true
    const { sx, sy } = toSource(e)
    lastRef.current = { sx, sy }
    brush.paintSegment({ x0: sx, y0: sy, x1: sx, y1: sy, mode, radius: (brushSize / 2) * ratio })
    redraw()
  }

  const onPointerMove = (e) => {
    const { lx, ly, sx, sy } = toSource(e)
    setCursor({ x: lx, y: ly, visible: true })
    if (!drawingRef.current || mode === "off") return
    const last = lastRef.current ?? { sx, sy }
    brush.paintSegment({ x0: last.sx, y0: last.sy, x1: sx, y1: sy, mode, radius: (brushSize / 2) * ratio })
    lastRef.current = { sx, sy }
    redraw()
  }

  const endStroke = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    brush.endStroke()
  }

  return (
    <div className="bg-brush-layer" style={{ width: displayW, height: displayH }}>
      <canvas
        ref={canvasRef}
        width={displayW}
        height={displayH}
        className="bg-brush-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={(e) => {
          setCursor((c) => ({ ...c, visible: false }))
          endStroke(e)
        }}
      />
      {cursor.visible ? (
        <div
          className="bg-brush-cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: brushSize,
            height: brushSize,
          }}
        />
      ) : null}
    </div>
  )
}
