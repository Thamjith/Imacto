import { useCallback, useEffect, useRef, useState } from "react"

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load image for brushing."))
    img.src = src
  })
}

/**
 * Manual brush controller for the Background Remove tool.
 *
 * Holds a full-resolution work canvas seeded from the model cutout. Erase clears
 * alpha (`destination-out`); restore clips a brush path and redraws the original
 * image. Each completed stroke snapshots the canvas onto an unbounded undo stack
 * (capped only by memory, per design). The edited cutout is committed to a PNG
 * object URL that export and the live preview reuse.
 */
export function useBgBrush() {
  const workCanvasRef = useRef(null)
  const originalRef = useRef(null)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const lastCutoutRef = useRef(null)
  const editedSeqRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [editedUrl, setEditedUrl] = useState(null)
  const [version, setVersion] = useState(0)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const clearEdited = useCallback(() => {
    editedSeqRef.current += 1
    setEditedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  const commitEdited = useCallback(() => {
    const work = workCanvasRef.current
    if (!work) return
    const seq = (editedSeqRef.current += 1)
    work.toBlob((blob) => {
      if (!blob || seq !== editedSeqRef.current) return
      const url = URL.createObjectURL(blob)
      setEditedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    }, "image/png")
  }, [])

  const syncEdited = useCallback(
    (atBaseline) => {
      if (atBaseline) clearEdited()
      else commitEdited()
    },
    [clearEdited, commitEdited]
  )

  /** Seed the work canvas from a model cutout + original image. Deduped by cutout URL. */
  const initBaseline = useCallback(
    async (cutoutUrl, image) => {
      if (!cutoutUrl || !image) return
      if (lastCutoutRef.current === cutoutUrl) return
      lastCutoutRef.current = cutoutUrl

      const work = workCanvasRef.current ?? document.createElement("canvas")
      work.width = image.width
      work.height = image.height
      const ctx = work.getContext("2d")
      if (!ctx) return

      const [cutout, original] = await Promise.all([
        loadImageElement(cutoutUrl),
        loadImageElement(image.objectUrl),
      ])
      ctx.clearRect(0, 0, work.width, work.height)
      ctx.drawImage(cutout, 0, 0, work.width, work.height)

      workCanvasRef.current = work
      originalRef.current = original
      undoStackRef.current = [ctx.getImageData(0, 0, work.width, work.height)]
      redoStackRef.current = []
      clearEdited()
      setCanUndo(false)
      setCanRedo(false)
      setReady(true)
      bump()
    },
    [bump, clearEdited]
  )

  /** Paint one stroke segment (source-space coords + radius). Does not snapshot. */
  const paintSegment = useCallback(({ x0, y0, x1, y1, mode, radius }) => {
    const work = workCanvasRef.current
    const ctx = work?.getContext("2d")
    if (!work || !ctx) return
    const r = Math.max(1, radius)
    const dist = Math.hypot(x1 - x0, y1 - y0)
    const steps = Math.max(1, Math.ceil(dist / (r * 0.4)))

    if (mode === "erase") {
      ctx.save()
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = "#000"
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps
        ctx.beginPath()
        ctx.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    } else if (mode === "restore" && originalRef.current) {
      ctx.save()
      ctx.beginPath()
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps
        const cx = x0 + (x1 - x0) * t
        const cy = y0 + (y1 - y0) * t
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.clip()
      ctx.drawImage(originalRef.current, 0, 0, work.width, work.height)
      ctx.restore()
    }
  }, [])

  /** Snapshot the canvas after a completed stroke. */
  const endStroke = useCallback(() => {
    const work = workCanvasRef.current
    const ctx = work?.getContext("2d")
    if (!work || !ctx) return
    undoStackRef.current.push(ctx.getImageData(0, 0, work.width, work.height))
    redoStackRef.current = []
    setCanUndo(undoStackRef.current.length > 1)
    setCanRedo(false)
    commitEdited()
  }, [commitEdited])

  const undo = useCallback(() => {
    const stack = undoStackRef.current
    const ctx = workCanvasRef.current?.getContext("2d")
    if (!ctx || stack.length <= 1) return
    redoStackRef.current.push(stack.pop())
    ctx.putImageData(stack[stack.length - 1], 0, 0)
    setCanUndo(stack.length > 1)
    setCanRedo(true)
    syncEdited(stack.length === 1)
    bump()
  }, [bump, syncEdited])

  const redo = useCallback(() => {
    const redoStack = redoStackRef.current
    const ctx = workCanvasRef.current?.getContext("2d")
    if (!ctx || redoStack.length === 0) return
    const next = redoStack.pop()
    undoStackRef.current.push(next)
    ctx.putImageData(next, 0, 0)
    setCanUndo(true)
    setCanRedo(redoStack.length > 0)
    syncEdited(false)
    bump()
  }, [bump, syncEdited])

  const reset = useCallback(() => {
    const base = undoStackRef.current[0]
    const ctx = workCanvasRef.current?.getContext("2d")
    if (!base || !ctx) return
    ctx.putImageData(base, 0, 0)
    undoStackRef.current = [base]
    redoStackRef.current = []
    setCanUndo(false)
    setCanRedo(false)
    clearEdited()
    bump()
  }, [bump, clearEdited])

  const getWorkCanvas = useCallback(() => workCanvasRef.current, [])

  useEffect(() => {
    return () => {
      if (editedUrl) URL.revokeObjectURL(editedUrl)
    }
    // Only revoke the latest URL on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    ready,
    canUndo,
    canRedo,
    editedUrl,
    version,
    initBaseline,
    paintSegment,
    endStroke,
    undo,
    redo,
    reset,
    getWorkCanvas,
  }
}
