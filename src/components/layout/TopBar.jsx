import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

function formatMb(bytes) {
  return `${(bytes / 1048576).toFixed(0)} MB`
}

/**
 * Polls the JS heap size when available (Chromium-only `performance.memory`).
 * This is the JavaScript heap only — it does not account for GPU/canvas memory,
 * so treat it as a rough indicator while brushing large images.
 */
function HeapMeter() {
  const [used, setUsed] = useState(null)

  useEffect(() => {
    const mem = performance.memory
    if (!mem) return undefined
    const tick = () => setUsed(performance.memory.usedJSHeapSize)
    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [])

  if (used == null) return null

  return (
    <span className="heap-meter" title="JS heap (Chromium only — excludes GPU/canvas memory)">
      <i className="ti ti-cpu" />
      {formatMb(used)}
    </span>
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
        <HeapMeter />
        <Badge variant="secondary" className="badge-muted h-6 gap-1.5 rounded-full px-2.5 font-normal">
          <span className="dot" />
          Image only · video coming soon
        </Badge>
        <div className="avatar">RM</div>
      </div>
    </header>
  )
}
