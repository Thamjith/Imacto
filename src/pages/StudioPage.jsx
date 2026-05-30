import { useEffect } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Canvas } from "@/components/canvas/Canvas"
import { RightPanel } from "@/components/panels/RightPanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { StageBar } from "@/components/layout/StageBar"
import { TopBar } from "@/components/layout/TopBar"
import { ENABLED_TOOL_IDS } from "@/constants/tools"
import { useStudio } from "@/context/StudioContext"
import "@/App.css"

export function StudioPage() {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const studio = useStudio()

  const tool = ENABLED_TOOL_IDS.includes(toolId) ? toolId : null

  useEffect(() => {
    if (!tool && toolId) navigate("/crop", { replace: true })
  }, [tool, toolId, navigate])

  if (!tool) return <Navigate to="/crop" replace />

  const handleExport = () => studio.handleExport(tool)

  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <Sidebar active={tool} onSelect={(id) => navigate(`/${id}`)} />
        <div className="center">
          <StageBar
            step={studio.step}
            filename={studio.image?.name ?? null}
            size={studio.image?.sizeLabel ?? null}
          />
          <Canvas
            loaded={studio.loaded}
            image={studio.image}
            onFile={studio.uploadFile}
            uploadError={studio.uploadError}
            zoom={studio.zoom}
            setZoom={studio.setZoom}
            rotation={studio.toolState.rotate.rotation}
            flipH={studio.toolState.rotate.flipH}
            flipV={studio.toolState.rotate.flipV}
            undo={studio.handleUnload}
            showCropOverlay={tool === "crop"}
            cropState={studio.toolState.crop}
            onCropRegionChange={studio.updateCropRegion}
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
          disabled={!studio.loaded}
          exporting={studio.exporting}
          image={studio.image}
        />
      </div>
    </div>
  )
}
