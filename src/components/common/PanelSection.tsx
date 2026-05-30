import { type ReactNode } from "react"

interface PanelSectionProps {
  label: ReactNode
  children: ReactNode
}

export function PanelSection({ label, children }: PanelSectionProps) {
  return (
    <div className="rp-section">
      <div className="rp-label">{label}</div>
      {children}
    </div>
  )
}
