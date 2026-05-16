export function Preview({ rotation, flipH, flipV }) {
  const transform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`

  return (
    <div
      className="preview"
      style={{ transform, transition: "transform 220ms ease" }}
    >
      <div className="crop-overlay">
        <div className="crop-handle" style={{ top: -4, left: -4 }} />
        <div className="crop-handle" style={{ top: -4, right: -4 }} />
        <div className="crop-handle" style={{ bottom: -4, left: -4 }} />
        <div className="crop-handle" style={{ bottom: -4, right: -4 }} />
        <div className="crop-grid-v" style={{ left: "33.33%", top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-v" style={{ left: "66.66%", top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-h" style={{ top: "33.33%", left: 0, right: 0, height: 1 }} />
        <div className="crop-grid-h" style={{ top: "66.66%", left: 0, right: 0, height: 1 }} />
      </div>
      <div className="preview-label">preview canvas</div>
    </div>
  )
}
