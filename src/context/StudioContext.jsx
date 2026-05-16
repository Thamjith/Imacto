import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { DEFAULT_TOOL_STATE } from "@/constants/tools"
import { loadImageFromFile, revokeImageUrl } from "@/lib/imageUpload"

const StudioContext = createContext(null)

export function StudioProvider({ children }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [step, setStep] = useState("upload")
  const [toast, setToast] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [toolState, setToolState] = useState(DEFAULT_TOOL_STATE)

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
        crop: {
          ...s.crop,
          width: result.width,
          height: result.height,
          format: "keep",
        },
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

  const handleExport = useCallback(
    (format) => {
      if (!image) return
      const ext = format === "keep" ? image.name.split(".").pop() || "jpg" : format
      setStep("export")
      showToast(`Export queued · ${image.name.replace(/\.[^.]+$/, "")}.${ext} · imacto`)
    },
    [image, showToast]
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
    }),
    [image, loaded, zoom, step, toast, uploadError, toolState, uploadFile, handleUnload, handleExport]
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error("useStudio must be used within StudioProvider")
  return ctx
}
