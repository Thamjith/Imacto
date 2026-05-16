import { useEffect } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Canvas } from "@/components/canvas/Canvas"
import { RightPanel } from "@/components/panels/RightPanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { StageBar } from "@/components/layout/StageBar"
import { TopBar } from "@/components/layout/TopBar"
import { IMAGE_TOOL_IDS } from "@/constants/tools"
import { useStudioState } from "@/hooks/useStudioState"
import "@/App.css"

export function StudioPage() {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const studio = useStudioState()

  const tool = IMAGE_TOOL_IDS.includes(toolId) ? toolId : null

  useEffect(() => {
    if (!tool && toolId) navigate("/crop", { replace: true })
  }, [tool, toolId, navigate])

  if (!tool) return <Navigate to="/crop" replace />

  const handleExport = () => studio.handleExport(studio.toolState.crop.format)

  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <Sidebar active={tool} onSelect={(id) => navigate(`/${id}`)} />
        <div className="center">
          <StageBar
            step={studio.step}
            filename={studio.loaded ? "hero-photo.jpg" : null}
            size={studio.loaded ? "2.4 MB" : null}
          />
          <Canvas
            loaded={studio.loaded}
            onLoad={studio.handleLoad}
            zoom={studio.zoom}
            setZoom={studio.setZoom}
            rotation={studio.toolState.rotate.rotation}
            flipH={studio.toolState.rotate.flipH}
            flipV={studio.toolState.rotate.flipV}
            undo={studio.handleUnload}
          />
          {studio.toast && (
            <div className="toast">
              <i className="ti ti-circle-check" />
              <span>{studio.toast}</span>
            </div>
          )}
        </div>
        <RightPanel
          tool={tool}
          toolState={studio.toolState}
          setToolState={studio.setToolState}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}
