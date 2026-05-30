import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { DEFAULT_TOOL_STATE } from "@/constants/tools"
import { exportCompress, exportConvert, exportCropResize, exportRotateFlip } from "@/lib/imageExport"
import { loadImageFromFile, revokeImageUrl } from "@/lib/imageUpload"

const StudioContext = createContext(null)

function initialCropState(width, height) {
  const region = { x: 0, y: 0, width, height }
  return {
    ...DEFAULT_TOOL_STATE.crop,
    width,
    height,
    region,
  }
}

export function StudioProvider({ children }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [step, setStep] = useState("upload")
  const [toast, setToast] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [toolState, setToolState] = useState(DEFAULT_TOOL_STATE)
  const [exporting, setExporting] = useState(false)

  const loaded = image !== null

  const showToast = useCallback((message, duration = 2400) => {
    setToast(message)
    const id = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(id)
  }, [])

  const uploadFile = useCallback(async (file) => {
    setUploadError(null)
    try {
      const result = await loadImageFromFile(file)
      setImage((prev) => {
        if (prev?.objectUrl) revokeImageUrl(prev.objectUrl)
        return result
      })
      setToolState((s) => ({
        ...s,
        crop: initialCropState(result.width, result.height),
      }))
      setStep("edit")
      setZoom(100)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed."
      setUploadError(message)
      showToast(message, 3200)
    }
  }, [showToast])

  const handleUnload = useCallback(() => {
    setImage((prev) => {
      if (prev?.objectUrl) revokeImageUrl(prev.objectUrl)
      return null
    })
    setStep("upload")
    setZoom(100)
    setUploadError(null)
  }, [])

  const updateCropRegion = useCallback((region) => {
    setToolState((s) => {
      const next = { ...s.crop, region }
      if (s.crop.linked && s.crop.aspect === "Free") {
        return {
          ...s,
          crop: {
            ...next,
            width: region.width,
            height: region.height,
          },
        }
      }
      return { ...s, crop: next }
    })
  }, [])

  const handleExport = useCallback(
    async (toolId) => {
      if (!image || exporting) return

      if (toolId === "crop" || toolId === "compress" || toolId === "convert" || toolId === "rotate") {
        setExporting(true)
        try {
          const result =
            toolId === "crop"
              ? await exportCropResize(image, toolState.crop)
              : toolId === "compress"
                ? await exportCompress(image, toolState.compress)
                : toolId === "convert"
                  ? await exportConvert(image, toolState.convert)
                  : await exportRotateFlip(image, toolState.rotate)
          setStep("export")
          showToast(`Downloaded · ${result.filename} · ${result.sizeLabel}`, 3600)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Export failed."
          showToast(message, 3600)
        } finally {
          setExporting(false)
        }
        return
      }

      const format = toolState[toolId]?.format ?? toolState.crop.format
      const ext = format === "keep" ? image.name.split(".").pop() || "jpg" : format
      setStep("export")
      showToast(`Export queued · ${image.name.replace(/\.[^.]+$/, "")}.${ext} · imacto`)
    },
    [image, exporting, toolState, showToast]
  )

  useEffect(() => {
    return () => {
      if (image?.objectUrl) revokeImageUrl(image.objectUrl)
    }
  }, [image?.objectUrl])

  const value = useMemo(
    () => ({
      image,
      loaded,
      zoom,
      setZoom,
      step,
      toast,
      uploadError,
      toolState,
      setToolState,
      uploadFile,
      handleUnload,
      handleExport,
      updateCropRegion,
      exporting,
    }),
    [
      image,
      loaded,
      zoom,
      step,
      toast,
      uploadError,
      toolState,
      uploadFile,
      handleUnload,
      handleExport,
      updateCropRegion,
      exporting,
    ]
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error("useStudio must be used within StudioProvider")
  return ctx
}
