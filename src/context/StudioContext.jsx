import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_TOOL_STATE } from "@/constants/tools"
import { exportCompress, exportConvert, exportCropResize, exportRotateFlip } from "@/lib/imageExport"
import {
  composeBackgroundRemoval,
  downloadModel,
  exportBackgroundRemoval,
  forgetModel,
  getModelStatus,
  previewBackgroundRemoval,
} from "@/lib/backgroundRemoval"
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
  const [bgModel, setBgModel] = useState(() => getModelStatus())
  const [bgPreview, setBgPreview] = useState({ status: "idle", url: null })
  const bgPreviewKeyRef = useRef(null)
  const bgPreviewUrlRef = useRef(null)

  const downloadBgModel = useCallback(async (version, variant, onProgress) => {
    const resolved = await downloadModel(version, variant, onProgress)
    setBgModel(getModelStatus())
    return resolved
  }, [])

  const forgetBgModel = useCallback(() => {
    forgetModel()
    setBgModel(getModelStatus())
  }, [])

  const resetBgPreview = useCallback(() => {
    bgPreviewKeyRef.current = null
    if (bgPreviewUrlRef.current) {
      URL.revokeObjectURL(bgPreviewUrlRef.current)
      bgPreviewUrlRef.current = null
    }
    setBgPreview({ status: "idle", url: null })
  }, [])

  const runBgPreview = useCallback(async () => {
    const status = getModelStatus()
    if (!image || !status.downloaded) return
    const key = `${image.objectUrl}::${status.variant}`
    if (bgPreviewKeyRef.current === key) return
    bgPreviewKeyRef.current = key

    if (bgPreviewUrlRef.current) {
      URL.revokeObjectURL(bgPreviewUrlRef.current)
      bgPreviewUrlRef.current = null
    }
    setBgPreview({ status: "processing", url: null })
    try {
      const url = await previewBackgroundRemoval(image)
      if (bgPreviewKeyRef.current !== key) {
        URL.revokeObjectURL(url)
        return
      }
      bgPreviewUrlRef.current = url
      setBgPreview({ status: "ready", url })
    } catch {
      if (bgPreviewKeyRef.current === key) bgPreviewKeyRef.current = null
      setBgPreview({ status: "error", url: null })
    }
  }, [image])

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

      if (toolId === "bgremove") {
        if (!getModelStatus().downloaded) {
          showToast("Download the background-removal model first.", 3200)
          return
        }
        setExporting(true)
        try {
          // Reuse the live-preview cutout when available to skip a second inference pass.
          const result =
            bgPreview.status === "ready" && bgPreviewUrlRef.current
              ? await composeBackgroundRemoval(bgPreviewUrlRef.current, image, toolState.bgremove)
              : await exportBackgroundRemoval(image, toolState.bgremove, (p) => {
                  setToast(`${p.label}… ${Math.round(p.ratio * 100)}%`)
                })
          setStep("export")
          showToast(`Downloaded · ${result.filename} · ${result.sizeLabel}`, 3600)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Background removal failed."
          showToast(message, 3600)
        } finally {
          setExporting(false)
        }
        return
      }

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
    [image, exporting, toolState, showToast, bgPreview]
  )

  useEffect(() => {
    return () => {
      if (image?.objectUrl) revokeImageUrl(image.objectUrl)
    }
  }, [image?.objectUrl])

  // Drop any stale background-removal preview whenever the source image changes.
  useEffect(() => {
    resetBgPreview()
  }, [image?.objectUrl, resetBgPreview])

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
      bgModel,
      downloadBgModel,
      forgetBgModel,
      bgPreview,
      runBgPreview,
      resetBgPreview,
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
      bgModel,
      downloadBgModel,
      forgetBgModel,
      bgPreview,
      runBgPreview,
      resetBgPreview,
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
