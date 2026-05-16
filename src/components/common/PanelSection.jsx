export function PanelSection({ label, children }) {
  return (
    <div className="rp-section">
      <div className="rp-label">{label}</div>
      {children}
    </div>
  )
}
