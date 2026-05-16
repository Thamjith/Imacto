import { useState, useEffect } from 'react'
import './App.css'

const IMAGE_TOOLS = [
  { id: "crop",      label: "Crop & resize",     icon: "ti-crop"             },
  { id: "compress",  label: "Compress",           icon: "ti-arrows-minimize"  },
  { id: "convert",   label: "Convert format",     icon: "ti-transform"        },
  { id: "rotate",    label: "Rotate & flip",      icon: "ti-rotate-clockwise" },
  { id: "bgremove",  label: "Background remove",  icon: "ti-eraser"           },
  { id: "watermark", label: "Watermark",          icon: "ti-typography"       },
]

const VIDEO_TOOLS = [
  { id: "vtrim",     label: "Trim & clip",     icon: "ti-scissors"        },
  { id: "vconvert",  label: "Convert format",  icon: "ti-transform"       },
  { id: "vcompress", label: "Compress video",  icon: "ti-arrows-minimize" },
]

const TOOL_META = {
  crop:      { icon: "ti-crop",             title: "Crop & resize",     sub: "drag handles or set manually"  },
  compress:  { icon: "ti-arrows-minimize",  title: "Compress",          sub: "balance quality and file size" },
  convert:   { icon: "ti-transform",        title: "Convert format",    sub: "change file type"              },
  rotate:    { icon: "ti-rotate-clockwise", title: "Rotate & flip",     sub: "reorient your image"           },
  bgremove:  { icon: "ti-eraser",           title: "Background remove", sub: "isolate the subject"           },
  watermark: { icon: "ti-typography",       title: "Watermark",         sub: "overlay text or a mark"        },
}

function estimateKB(quality, format) {
  const baseKB = 2400
  const factor = { keep: 0.18, png: 0.62, webp: 0.12, avif: 0.08, gif: 0.45, bmp: 1.6, tiff: 1.2, jpg: 0.18 }[format] ?? 0.18
  return Math.round(baseKB * factor * (quality / 100))
}

// ── Sub-components ───────────────────────────────────────────────────────────

function NavItem({ icon, label, active, disabled, onClick, soon, tooltip }) {
  return (
    <div className="tooltip-wrap">
      <button
        type="button"
        className={`nav-item${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
        onClick={disabled ? undefined : onClick}
      >
        <i className={`ti ${icon}`} />
        <span>{label}</span>
        {soon && <span className="soon-pill">soon</span>}
      </button>
      {disabled && tooltip && <div className="tooltip">{tooltip}</div>}
    </div>
  )
}

function Sidebar({ active, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="nav-group">
        <div className="nav-label">image tools</div>
        {IMAGE_TOOLS.map(t => (
          <NavItem
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={active === t.id}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">video tools</div>
        {VIDEO_TOOLS.map(t => (
          <NavItem
            key={t.id}
            icon={t.icon}
            label={t.label}
            disabled
            soon
            tooltip="Video processing in development"
          />
        ))}
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="mark"><i className="ti ti-photo-edit" /></span>
        <span className="name"><em>ima</em><em>cto</em></span>
        <span className="sub">studio</span>
      </div>
      <div className="topbar-right">
        <span className="badge-muted">
          <span className="dot" />
          Image only · video coming soon
        </span>
        <div className="avatar">RM</div>
      </div>
    </header>
  )
}

function StageBar({ step, filename, size }) {
  const order = ["upload", "edit", "export"]
  const stateOf = (id) => {
    const idx = order.indexOf(id)
    const cur = order.indexOf(step)
    if (idx < cur) return "done"
    if (idx === cur) return "active"
    return "pending"
  }
  const steps = [
    { id: "upload", label: "Upload" },
    { id: "edit",   label: "Edit"   },
    { id: "export", label: "Export" },
  ]
  return (
    <div className="stagebar">
      <div className="steps">
        {steps.map((s, i) => (
          <span key={s.id} style={{ display: 'contents' }}>
            <div className={`step ${stateOf(s.id)}`}>
              <span className="num">
                {stateOf(s.id) === "done"
                  ? <i className="ti ti-check" style={{ fontSize: 12 }} />
                  : i + 1}
              </span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="chev"><i className="ti ti-chevron-right" /></span>
            )}
          </span>
        ))}
      </div>
      <div className="stagebar-right">
        {filename ? (
          <>
            <span className="filename">{filename}</span>
            <span className="size-pill">{size}</span>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>no file</span>
        )}
      </div>
    </div>
  )
}

function DropZone({ onLoad }) {
  const [dragover, setDragover] = useState(false)
  return (
    <div
      className={`drop-card${dragover ? ' dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => { e.preventDefault(); setDragover(false); onLoad() }}
      onClick={onLoad}
    >
      <div className="drop-icon"><i className="ti ti-cloud-upload" /></div>
      <div className="drop-title">Drop your file here</div>
      <div className="drop-sub">or click to browse</div>
      <div className="format-pills">
        {["JPG", "PNG", "WEBP", "AVIF", "MP4", "MOV"].map(f => (
          <span key={f} className="format-pill">{f}</span>
        ))}
      </div>
    </div>
  )
}

function Preview({ rotation, flipH, flipV }) {
  const transform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
  return (
    <div className="preview" style={{ transform, transition: 'transform 220ms ease' }}>
      <div className="crop-overlay">
        <div className="crop-handle" style={{ top: -4, left: -4 }} />
        <div className="crop-handle" style={{ top: -4, right: -4 }} />
        <div className="crop-handle" style={{ bottom: -4, left: -4 }} />
        <div className="crop-handle" style={{ bottom: -4, right: -4 }} />
        <div className="crop-grid-v" style={{ left: '33.33%', top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-v" style={{ left: '66.66%', top: 0, bottom: 0, width: 1 }} />
        <div className="crop-grid-h" style={{ top: '33.33%', left: 0, right: 0, height: 1 }} />
        <div className="crop-grid-h" style={{ top: '66.66%', left: 0, right: 0, height: 1 }} />
      </div>
      <div className="preview-label">preview canvas</div>
    </div>
  )
}

function Canvas({ loaded, onLoad, zoom, setZoom, rotation, flipH, flipV, undo }) {
  if (!loaded) {
    return (
      <div className="canvas">
        <DropZone onLoad={onLoad} />
        <div className="hint-row">
          <i className="ti ti-info-circle" />
          <span>max 25 MB · processed locally in your browser</span>
        </div>
      </div>
    )
  }
  return (
    <div className="canvas">
      <div className="preview-wrap">
        <Preview rotation={rotation} flipH={flipH} flipV={flipV} />
        <div className="meta-row">
          <span>1920 × 1080</span>
          <span className="sep" />
          <span>{zoom}%</span>
          <span className="sep" />
          <span>JPG · sRGB</span>
        </div>
        <div className="canvas-tools">
          <button className="icon-btn" onClick={() => setZoom(z => Math.min(400, z + 25))} title="Zoom in">
            <i className="ti ti-zoom-in" />
          </button>
          <button className="icon-btn" onClick={() => setZoom(z => Math.max(25, z - 25))} title="Zoom out">
            <i className="ti ti-zoom-out" />
          </button>
          <button className="icon-btn" onClick={() => setZoom(100)}>
            <i className="ti ti-maximize" /><span>Fit</span>
          </button>
          <button className="icon-btn" onClick={undo}>
            <i className="ti ti-arrow-back-up" /><span>Undo</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Right-panel tool sections ────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div className="rp-section">
      <div className="rp-label">{label}</div>
      {children}
    </div>
  )
}

function CropPanel({ state, set }) {
  const aspects = ["Free", "1:1", "16:9", "4:3", "3:2"]
  return (
    <>
      <Section label="aspect ratio">
        <div className="chip-row">
          {aspects.map(a => (
            <button key={a} className={`chip${state.aspect === a ? ' active' : ''}`} onClick={() => set({ aspect: a })}>{a}</button>
          ))}
        </div>
      </Section>
      <Section label="dimensions (px)">
        <div className="dim-row">
          <div>
            <label className="field-label">Width</label>
            <input className="num-input" type="number" value={state.width} onChange={e => set({ width: e.target.value })} />
          </div>
          <button
            className={`lock-btn${state.linked ? ' locked' : ''}`}
            onClick={() => set({ linked: !state.linked })}
            title={state.linked ? 'Unlock ratio' : 'Lock ratio'}
          >
            <i className={`ti ${state.linked ? 'ti-link' : 'ti-link-off'}`} />
          </button>
          <div>
            <label className="field-label">Height</label>
            <input className="num-input" type="number" value={state.height} onChange={e => set({ height: e.target.value })} />
          </div>
        </div>
      </Section>
      <Section label="quality">
        <div className="slider-head">
          <span className="k">Compression</span>
          <span className="v">{state.quality}%</span>
        </div>
        <input type="range" min="10" max="100" value={state.quality} onChange={e => set({ quality: +e.target.value })} />
      </Section>
      <Section label="output format">
        <div className="select-wrap">
          <select className="select" value={state.format} onChange={e => set({ format: e.target.value })}>
            <option value="keep">Keep original (JPG)</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="gif">GIF</option>
            <option value="bmp">BMP</option>
            <option value="tiff">TIFF</option>
          </select>
          <span className="select-caret"><i className="ti ti-chevron-down" /></span>
        </div>
        <div className="estimate-row">
          <span>Original: 2.4 MB</span>
          <span className="estimate-good">→ est. ~{estimateKB(state.quality, state.format)} KB</span>
        </div>
      </Section>
    </>
  )
}

function CompressPanel({ state, set }) {
  return (
    <>
      <Section label="preset">
        <div className="chip-row">
          {["Lossless", "Balanced", "Smallest"].map(p => (
            <button
              key={p}
              className={`chip${state.preset === p ? ' active' : ''}`}
              onClick={() => set({ preset: p, quality: p === "Lossless" ? 100 : p === "Balanced" ? 80 : 55 })}
            >{p}</button>
          ))}
        </div>
      </Section>
      <Section label="quality">
        <div className="slider-head">
          <span className="k">Compression</span>
          <span className="v">{state.quality}%</span>
        </div>
        <input type="range" min="10" max="100" value={state.quality} onChange={e => set({ quality: +e.target.value, preset: "Custom" })} />
        <div className="field-help">Higher values preserve detail; lower values reduce file size.</div>
      </Section>
      <Section label="strip metadata">
        <div className="row-between">
          <span style={{ fontSize: 12 }}>Remove EXIF data</span>
          <div className={`toggle${state.stripExif ? ' on' : ''}`} onClick={() => set({ stripExif: !state.stripExif })} />
        </div>
        <div className="field-help">Clears camera, location and timestamp.</div>
      </Section>
      <Section label="estimated size">
        <div className="estimate-row">
          <span>Original: 2.4 MB</span>
          <span className="estimate-good">→ est. ~{estimateKB(state.quality, "keep")} KB</span>
        </div>
      </Section>
    </>
  )
}

function ConvertPanel({ state, set }) {
  return (
    <>
      <Section label="target format">
        <div className="select-wrap">
          <select className="select" value={state.format} onChange={e => set({ format: e.target.value })}>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="jpg">JPG</option>
            <option value="gif">GIF</option>
            <option value="bmp">BMP</option>
            <option value="tiff">TIFF</option>
          </select>
          <span className="select-caret"><i className="ti ti-chevron-down" /></span>
        </div>
        <div className="field-help">Source: JPG · sRGB</div>
      </Section>
      <Section label="color profile">
        <div className="chip-row">
          {["sRGB", "Display P3", "Adobe RGB"].map(p => (
            <button key={p} className={`chip${state.profile === p ? ' active' : ''}`} onClick={() => set({ profile: p })}>{p}</button>
          ))}
        </div>
      </Section>
      <Section label="background">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>For transparent → JPG</span>
        </div>
        <div className="swatch-row">
          <div className={`swatch${state.bg === 'white' ? ' active' : ''}`} style={{ background: '#fff' }} onClick={() => set({ bg: 'white' })} />
          <div className={`swatch${state.bg === 'black' ? ' active' : ''}`} style={{ background: '#000' }} onClick={() => set({ bg: 'black' })} />
          <div className={`swatch checker${state.bg === 'transparent' ? ' active' : ''}`} onClick={() => set({ bg: 'transparent' })} />
        </div>
      </Section>
      <Section label="size comparison">
        <div className="estimate-row">
          <span>Original: 2.4 MB</span>
          <span className="estimate-good">→ est. ~{estimateKB(85, state.format)} KB</span>
        </div>
      </Section>
    </>
  )
}

function RotatePanel({ state, set }) {
  return (
    <>
      <Section label="rotate">
        <div className="rotate-grid">
          <button className="btn-secondary" onClick={() => set({ rotation: (state.rotation - 90 + 360) % 360 })}>
            <i className="ti ti-rotate" /> Left 90°
          </button>
          <button className="btn-secondary" onClick={() => set({ rotation: (state.rotation + 90) % 360 })}>
            <i className="ti ti-rotate-clockwise" /> Right 90°
          </button>
        </div>
        <div className="slider-head" style={{ marginTop: 12 }}>
          <span className="k">Fine angle</span>
          <span className="v">{state.rotation}°</span>
        </div>
        <input type="range" min="0" max="359" value={state.rotation} onChange={e => set({ rotation: +e.target.value })} />
      </Section>
      <Section label="flip">
        <div className="rotate-grid">
          <button
            className="btn-secondary"
            onClick={() => set({ flipH: !state.flipH })}
            style={state.flipH ? { borderColor: 'var(--color-border-primary)' } : {}}
          >
            <i className="ti ti-flip-horizontal" /> Horizontal
          </button>
          <button
            className="btn-secondary"
            onClick={() => set({ flipV: !state.flipV })}
            style={state.flipV ? { borderColor: 'var(--color-border-primary)' } : {}}
          >
            <i className="ti ti-flip-vertical" /> Vertical
          </button>
        </div>
      </Section>
      <Section label="output format">
        <div className="select-wrap">
          <select className="select" value={state.format} onChange={e => set({ format: e.target.value })}>
            <option value="keep">Keep original (JPG)</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
          <span className="select-caret"><i className="ti ti-chevron-down" /></span>
        </div>
      </Section>
    </>
  )
}

function BgRemovePanel({ state, set }) {
  return (
    <>
      <Section label="method">
        <div className="chip-row">
          {["Auto", "Subject", "Color"].map(m => (
            <button key={m} className={`chip${state.method === m ? ' active' : ''}`} onClick={() => set({ method: m })}>{m}</button>
          ))}
        </div>
        <div className="field-help">Auto detects the primary subject using an on-device model.</div>
      </Section>
      <Section label="edge refinement">
        <div className="slider-head">
          <span className="k">Feather</span>
          <span className="v">{state.feather}px</span>
        </div>
        <input type="range" min="0" max="20" value={state.feather} onChange={e => set({ feather: +e.target.value })} />
      </Section>
      <Section label="replace with">
        <div className="swatch-row">
          <div className={`swatch checker${state.bg === 'transparent' ? ' active' : ''}`} onClick={() => set({ bg: 'transparent' })} />
          <div className={`swatch${state.bg === 'white' ? ' active' : ''}`} style={{ background: '#fff' }} onClick={() => set({ bg: 'white' })} />
          <div className={`swatch${state.bg === 'black' ? ' active' : ''}`} style={{ background: '#000' }} onClick={() => set({ bg: 'black' })} />
          <div
            className={`swatch${state.bg === 'blur' ? ' active' : ''}`}
            style={{ background: 'linear-gradient(135deg,#5a6cf5,#22b5a8)' }}
            onClick={() => set({ bg: 'blur' })}
          />
        </div>
      </Section>
      <Section label="output format">
        <div className="select-wrap">
          <select className="select" defaultValue="png">
            <option value="png">PNG (recommended)</option>
            <option value="webp">WebP</option>
          </select>
          <span className="select-caret"><i className="ti ti-chevron-down" /></span>
        </div>
      </Section>
    </>
  )
}

function WatermarkPanel({ state, set }) {
  return (
    <>
      <Section label="text">
        <input
          className="text-input"
          value={state.text}
          onChange={e => set({ text: e.target.value })}
          placeholder="© your name"
        />
      </Section>
      <Section label="position">
        <div className="chip-row">
          {["TL","T","TR","L","C","R","BL","B","BR"].map(p => (
            <button
              key={p}
              className={`chip${state.position === p ? ' active' : ''}`}
              style={{ minWidth: 32, justifyContent: 'center', padding: '0 6px' }}
              onClick={() => set({ position: p })}
            >{p}</button>
          ))}
        </div>
      </Section>
      <Section label="opacity">
        <div className="slider-head">
          <span className="k">Opacity</span>
          <span className="v">{state.opacity}%</span>
        </div>
        <input type="range" min="10" max="100" value={state.opacity} onChange={e => set({ opacity: +e.target.value })} />
      </Section>
      <Section label="size">
        <div className="slider-head">
          <span className="k">Text size</span>
          <span className="v">{state.size}px</span>
        </div>
        <input type="range" min="8" max="96" value={state.size} onChange={e => set({ size: +e.target.value })} />
      </Section>
    </>
  )
}

function RightPanel({ tool, toolState, setToolState, onExport }) {
  const meta = TOOL_META[tool]
  const update = (key) => (patch) => setToolState(s => ({ ...s, [key]: { ...s[key], ...patch } }))

  return (
    <aside className="rightpanel">
      <div className="rp-header">
        <div className="rp-title">
          <i className={`ti ${meta.icon}`} />
          <span>{meta.title}</span>
        </div>
        <div className="rp-subtitle">{meta.sub}</div>
      </div>
      <div className="rp-body">
        {tool === "crop"      && <CropPanel      state={toolState.crop}      set={update("crop")}      />}
        {tool === "compress"  && <CompressPanel  state={toolState.compress}  set={update("compress")}  />}
        {tool === "convert"   && <ConvertPanel   state={toolState.convert}   set={update("convert")}   />}
        {tool === "rotate"    && <RotatePanel    state={toolState.rotate}    set={update("rotate")}    />}
        {tool === "bgremove"  && <BgRemovePanel  state={toolState.bgremove}  set={update("bgremove")}  />}
        {tool === "watermark" && <WatermarkPanel state={toolState.watermark} set={update("watermark")} />}
      </div>
      <div className="rp-footer">
        <button className="btn-primary" onClick={onExport}>
          <i className="ti ti-download" />Export file
        </button>
      </div>
    </aside>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tool, setTool] = useState("crop")
  const [loaded, setLoaded] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [step, setStep] = useState("edit")
  const [toast, setToast] = useState(null)

  const [toolState, setToolState] = useState({
    crop:      { aspect: "Free", width: 1920, height: 1080, linked: true, quality: 85, format: "keep" },
    compress:  { preset: "Balanced", quality: 80, stripExif: true },
    convert:   { format: "webp", profile: "sRGB", bg: "white" },
    rotate:    { rotation: 0, flipH: false, flipV: false, format: "keep" },
    bgremove:  { method: "Auto", feather: 4, bg: "transparent" },
    watermark: { text: "© studio 2026", position: "BR", opacity: 60, size: 24 },
  })

  const handleLoad = () => { setLoaded(true); setStep("edit") }
  const handleUnload = () => { setLoaded(false); setStep("upload") }

  const handleExport = () => {
    const ext = toolState.crop.format === "keep" ? "jpg" : toolState.crop.format
    setStep("export")
    setToast(`Export queued · hero-photo.${ext} · imacto`)
    setTimeout(() => setToast(null), 2400)
  }

  useEffect(() => {
    if (!loaded) setStep("upload")
    else if (step === "upload") setStep("edit")
  }, [loaded])

  return (
    <div className="stage">
      <div className="app">
        <TopBar />
        <div className="main">
          <Sidebar active={tool} onSelect={setTool} />
          <div className="center">
            <StageBar
              step={step}
              filename={loaded ? "hero-photo.jpg" : null}
              size={loaded ? "2.4 MB" : null}
            />
            <Canvas
              loaded={loaded}
              onLoad={handleLoad}
              zoom={zoom}
              setZoom={setZoom}
              rotation={toolState.rotate.rotation}
              flipH={toolState.rotate.flipH}
              flipV={toolState.rotate.flipV}
              undo={handleUnload}
            />
            {toast && (
              <div className="toast">
                <i className="ti ti-circle-check" />
                <span>{toast}</span>
              </div>
            )}
          </div>
          <RightPanel
            tool={tool}
            toolState={toolState}
            setToolState={setToolState}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  )
}
