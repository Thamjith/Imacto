import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StudioPage } from "@/pages/StudioPage"

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="stage">
          <Routes>
            <Route path="/" element={<Navigate to="/crop" replace />} />
            <Route path="/:toolId" element={<StudioPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  )
}
