import { useEffect, useMemo, useState } from "react"

function formatMb(bytes: number): number {
  return Math.round(bytes / 1048576)
}

interface GpuInfo {
  label: string
  full: string
}

/** One-time WebGL probe for the GPU renderer name. Releases the context immediately. */
function probeGpu(): GpuInfo | null {
  try {
    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return null
    const dbg = gl.getExtension("WEBGL_debug_renderer_info")
    const raw: string | null = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    if (!raw) return null
    // "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, ...)" -> "Apple M1"
    const angle = raw.match(/ANGLE \(([^)]*)\)/)
    const inner = angle ? angle[1] : raw
    const model = inner
      .split(",")
      .map((s) => s.replace(/.*Renderer:\s*/, "").trim())
      .filter(Boolean)
      .pop()
    return { label: model || inner.trim(), full: raw }
  } catch {
    return null
  }
}

interface StatPillProps {
  label: string
  value: string
  title?: string
  className?: string
}

function StatPill({ label, value, title, className }: StatPillProps) {
  return (
    <span className={`heap-meter${className ? ` ${className}` : ""}`} title={title}>
      <span className="k">{label}</span>
      <span className="v">{value}</span>
    </span>
  )
}

interface HeapInfo {
  used: number
  limit: number
}

/**
 * Top-right system monitor. Shows only values browsers actually expose — there is
 * no Web API for true CPU%/GPU% usage. Each pill renders only when its API is
 * available, so non-Chromium browsers degrade to fewer (or no) pills.
 *
 * - JS heap (Chromium `performance.memory`): the JavaScript heap only — it does
 *   NOT include GPU/canvas memory, so treat it as a rough indicator.
 * - Device RAM (`navigator.deviceMemory`): approximate, coarse, capped at 8 GB.
 * - GPU: renderer name via WebGL debug info (no utilization is available).
 */
function SystemMonitor() {
  const [heap, setHeap] = useState<HeapInfo | null>(null)

  useEffect(() => {
    if (!performance.memory) return undefined
    const tick = () => {
      const m = performance.memory
      if (!m) return
      setHeap({ used: m.usedJSHeapSize, limit: m.jsHeapSizeLimit })
    }
    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [])

  const deviceMemory = useMemo(
    () => (typeof navigator !== "undefined" ? navigator.deviceMemory : undefined),
    []
  )
  const gpu = useMemo(() => probeGpu(), [])

  if (!heap && deviceMemory == null && !gpu) return null

  return (
    <div className="sys-monitor">
      {heap ? (
        <StatPill
          label="JS"
          value={`${formatMb(heap.used)} / ${formatMb(heap.limit)} MB`}
          title="JavaScript heap used / limit (Chromium only — excludes GPU & canvas memory)"
        />
      ) : null}
      {deviceMemory != null ? (
        <StatPill
          label="RAM"
          value={`${deviceMemory} GB`}
          title="Approximate device memory (coarse, capped at 8 GB)"
        />
      ) : null}
      {gpu ? (
        <StatPill label="GPU" value={gpu.label} title={gpu.full} className="stat-pill-gpu" />
      ) : null}
    </div>
  )
}

export function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="mark">
          <i className="ti ti-photo-edit" />
        </span>
        <span className="name">
          <em>ima</em>
          <em>cto</em>
        </span>
        <span className="sub">studio</span>
      </div>
      <div className="topbar-right">
        <SystemMonitor />
      </div>
    </header>
  )
}
