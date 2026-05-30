import { Badge } from "@/components/ui/badge"

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "edit", label: "Edit" },
  { id: "export", label: "Export" },
]

function stepState(step: string, current: string): "done" | "active" | "pending" {
  const order = STEPS.map((s) => s.id)
  const idx = order.indexOf(step)
  const cur = order.indexOf(current)
  if (idx < cur) return "done"
  if (idx === cur) return "active"
  return "pending"
}

interface StageBarProps {
  step: string
  filename: string | null
  size: string | null
}

export function StageBar({ step, filename, size }: StageBarProps) {
  return (
    <div className="stagebar">
      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s.id} style={{ display: "contents" }}>
            <div className={`step ${stepState(s.id, step)}`}>
              <span className="num">
                {stepState(s.id, step) === "done" ? (
                  <i className="ti ti-check" style={{ fontSize: 12 }} />
                ) : (
                  i + 1
                )}
              </span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="chev">
                <i className="ti ti-chevron-right" />
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="stagebar-right">
        {filename ? (
          <>
            <span className="filename">{filename}</span>
            <Badge variant="secondary" className="size-pill font-mono text-[11px] font-normal">
              {size}
            </Badge>
          </>
        ) : (
          <span className="text-xs text-[var(--color-text-tertiary)]">no file</span>
        )}
      </div>
    </div>
  )
}
