import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import { DEFAULT_TOOL_STATE, type ToolId, type ToolState } from "@/constants/tools"
import { exportCompress, exportConvert, exportCropResize, exportRotateFlip } from "@/lib/imageExport"
import {
  composeBackgroundRemoval,
  downloadModel,
  exportBackgroundRemoval,
  forgetModel,
  getModelStatus,
  previewBackgroundRemoval,
  type BgModelStatus,
  type DownloadProgress,
  type ModelVariant,
} from "@/lib/backgroundRemoval"
import { loadImageFromFile, revokeImageUrl, type LoadedImage } from "@/lib/imageUpload"
import { useBgBrush, type BgBrush } from "@/hooks/useBgBrush"
import type { Box } from "@/lib/cropGeometry"

type Step = "upload" | "edit" | "export"
type BgPreviewStatus = "idle" | "processing" | "ready" | "error"

export interface BgPreviewState {
  status: BgPreviewStatus
  url: string | null
}

export interface StudioContextValue {
  image: LoadedImage | null
  loaded: boolean
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  step: Step
  toast: string | null
  uploadError: string | null
  toolState: ToolState
  setToolState: Dispatch<SetStateAction<ToolState>>
  uploadFile: (file: File) => Promise<void>
  handleUnload: () => void
  handleExport: (toolId: ToolId) => Promise<void>
  updateCropRegion: (region: Box) => void
  exporting: boolean
  bgModel: BgModelStatus
  downloadBgModel: (
    version: string | null,
    variant: ModelVariant,
    onProgress?: (progress: DownloadProgress) => void
  ) => Promise<string>
  forgetBgModel: () => void
  bgPreview: BgPreviewState
  runBgPreview: () => Promise<void>
  resetBgPreview: () => void
  bgBrush: BgBrush
}

const StudioContext = createContext<StudioContextValue | null>(null)

function initialCropState(width: number, height: number): ToolState["crop"] {
  const region = { x: 0, y: 0, width, height }
  return {
    ...DEFAULT_TOOL_STATE.crop,
    width,
    height,
    region,
  }
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [zoom, setZoom] = useState(100)
  const [step, setStep] = useState<Step>("upload")
  const [toast, setToast] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_TOOL_STATE)
  const [exporting, setExporting] = useState(false)
  const [bgModel, setBgModel] = useState<BgModelStatus>(() => getModelStatus())
  const [bgPreview, setBgPreview] = useState<BgPreviewState>({ status: "idle", url: null })
  const bgRunIdRef = useRef(0)
  const bgPreviewUrlRef = useRef<string | null>(null)
  const bgBrush = useBgBrush()

  const downloadBgModel = useCallback<StudioContextValue["downloadBgModel"]>(
    async (version, variant, onProgress) => {
      const resolved = await downloadModel(version, variant, onProgress)
      setBgModel(getModelStatus())
      return resolved
    },
    []
  )

  const forgetBgModel = useCallback(() => {
    forgetModel()
    setBgModel(getModelStatus())
  }, [])

  const resetBgPreview = useCallback(() => {
    bgRunIdRef.current += 1
    if (bgPreviewUrlRef.current) {
      URL.revokeObjectURL(bgPreviewUrlRef.current)
      bgPreviewUrlRef.current = null
    }
    setBgPreview({ status: "idle", url: null })
  }, [])

  // Explicit, user-triggered background removal. Re-runnable on demand (e.g. to
  // re-run with the same already-downloaded model); a run id invalidates any
  // result that finishes after a newer run started or the image changed.
  const runBgPreview = useCallback(async () => {
    if (!getModelStatus().downloaded || !image) return
    const runId = ++bgRunIdRef.current

    if (bgPreviewUrlRef.current) {
      URL.revokeObjectURL(bgPreviewUrlRef.current)
      bgPreviewUrlRef.current = null
    }
    setBgPreview({ status: "processing", url: null })
    try {
      const url = await previewBackgroundRemoval(image)
      if (bgRunIdRef.current !== runId) {
        URL.revokeObjectURL(url)
        return
      }
      bgPreviewUrlRef.current = url
      setBgPreview({ status: "ready", url })
    } catch {
      if (bgRunIdRef.current === runId) setBgPreview({ status: "error", url: null })
    }
  }, [image])

  const loaded = image !== null

  const showToast = useCallback((message: string, duration = 2400) => {
    setToast(message)
    const id = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(id)
  }, [])

  const uploadFile = useCallback(
    async (file: File) => {
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
    },
    [showToast]
  )

  const handleUnload = useCallback(() => {
    setImage((prev) => {
      if (prev?.objectUrl) revokeImageUrl(prev.objectUrl)
      return null
    })
    setStep("upload")
    setZoom(100)
    setUploadError(null)
  }, [])

  const updateCropRegion = useCallback((region: Box) => {
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
    async (toolId: ToolId) => {
      if (!image || exporting) return

      if (toolId === "bgremove") {
        if (!getModelStatus().downloaded) {
          showToast("Download the background-removal model first.", 3200)
          return
        }
        setExporting(true)
        try {
          // Prefer the brush-edited cutout, else the live-preview cutout, to skip
          // a second inference pass. Fall back to a full run only if neither exists.
          const cutoutUrl =
            bgBrush.editedUrl ?? (bgPreview.status === "ready" ? bgPreviewUrlRef.current : null)
          const result = cutoutUrl
            ? await composeBackgroundRemoval(cutoutUrl, image, toolState.bgremove)
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

      const toolFormat = (toolState[toolId] as { format?: string }).format
      const format = toolFormat ?? toolState.crop.format
      const ext = format === "keep" ? image.name.split(".").pop() || "jpg" : format
      setStep("export")
      showToast(`Export queued · ${image.name.replace(/\.[^.]+$/, "")}.${ext} · imacto`)
    },
    [image, exporting, toolState, showToast, bgPreview, bgBrush.editedUrl]
  )

  useEffect(() => {
    return () => {
      if (image?.objectUrl) revokeImageUrl(image.objectUrl)
    }
  }, [image?.objectUrl])

  // Drop any stale background-removal preview/brush whenever the source image
  // changes (removal is explicit now, so nothing re-runs automatically).
  useEffect(() => {
    resetBgPreview()
    setToolState((s) =>
      s.bgremove.brushMode === "off" ? s : { ...s, bgremove: { ...s.bgremove, brushMode: "off" } }
    )
  }, [image?.objectUrl, resetBgPreview])

  // Seed the manual-brush work canvas from the model cutout once it's ready.
  const initBaseline = bgBrush.initBaseline
  useEffect(() => {
    if (bgPreview.status === "ready" && bgPreview.url && image) {
      initBaseline(bgPreview.url, image)
    }
  }, [bgPreview.status, bgPreview.url, image, initBaseline])

  const value = useMemo<StudioContextValue>(
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
      bgBrush,
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
      bgBrush,
    ]
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error("useStudio must be used within StudioProvider")
  return ctx
}
