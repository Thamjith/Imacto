import { useEffect, useState } from "react"
import { DEFAULT_TOOL_STATE } from "@/constants/tools"

export function useStudioState() {
  const [loaded, setLoaded] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [step, setStep] = useState("edit")
  const [toast, setToast] = useState(null)
  const [toolState, setToolState] = useState(DEFAULT_TOOL_STATE)

  const handleLoad = () => {
    setLoaded(true)
    setStep("edit")
  }

  const handleUnload = () => {
    setLoaded(false)
    setStep("upload")
  }

  const handleExport = (format) => {
    const ext = format === "keep" ? "jpg" : format
    setStep("export")
    setToast(`Export queued · hero-photo.${ext} · imacto`)
    setTimeout(() => setToast(null), 2400)
  }

  useEffect(() => {
    if (!loaded) setStep("upload")
    else if (step === "upload") setStep("edit")
  }, [loaded])

  return {
    loaded,
    zoom,
    setZoom,
    step,
    toast,
    toolState,
    setToolState,
    handleLoad,
    handleUnload,
    handleExport,
  }
}
