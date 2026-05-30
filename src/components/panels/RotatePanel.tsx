import { Button } from "@/components/ui/button"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"
import { cn } from "@/lib/utils"
import { type RotateToolState } from "@/constants/tools"

const FORMAT_OPTIONS = [
  { value: "keep", label: "Keep original (JPG)" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
]

interface RotatePanelProps {
  state: RotateToolState
  set: (patch: Partial<RotateToolState>) => void
}

export function RotatePanel({ state, set }: RotatePanelProps) {
  return (
    <>
      <PanelSection label="rotate">
        <div className="rotate-grid">
          <Button
            type="button"
            variant="secondary"
            className="btn-secondary w-full"
            onClick={() => set({ rotation: (state.rotation - 90 + 360) % 360 })}
          >
            <i className="ti ti-rotate" /> Left 90°
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="btn-secondary w-full"
            onClick={() => set({ rotation: (state.rotation + 90) % 360 })}
          >
            <i className="ti ti-rotate-clockwise" /> Right 90°
          </Button>
        </div>
        <div className="mt-3">
          <SliderField
            label="Fine angle"
            value={state.rotation}
            onChange={(rotation) => set({ rotation })}
            min={0}
            max={359}
            unit="°"
          />
        </div>
      </PanelSection>
      <PanelSection label="flip">
        <div className="rotate-grid">
          <Button
            type="button"
            variant="secondary"
            className={cn("btn-secondary w-full", state.flipH && "border-[var(--color-border-primary)]")}
            onClick={() => set({ flipH: !state.flipH })}
          >
            <i className="ti ti-flip-horizontal" /> Horizontal
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={cn("btn-secondary w-full", state.flipV && "border-[var(--color-border-primary)]")}
            onClick={() => set({ flipV: !state.flipV })}
          >
            <i className="ti ti-flip-vertical" /> Vertical
          </Button>
        </div>
      </PanelSection>
      <PanelSection label="output format">
        <FormatSelect value={state.format} onChange={(format) => set({ format })} options={FORMAT_OPTIONS} />
      </PanelSection>
    </>
  )
}
