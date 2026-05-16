import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChipGroup } from "@/components/common/ChipGroup"
import { EstimateRow } from "@/components/common/EstimateRow"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"
import { cn } from "@/lib/utils"

const ASPECTS = ["Free", "1:1", "16:9", "4:3", "3:2"]
const FORMAT_OPTIONS = [
  { value: "keep", label: "Keep original (JPG)" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "gif", label: "GIF" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
]

export function CropPanel({ state, set }) {
  return (
    <>
      <PanelSection label="aspect ratio">
        <ChipGroup options={ASPECTS} value={state.aspect} onChange={(aspect) => set({ aspect })} />
      </PanelSection>
      <PanelSection label="dimensions (px)">
        <div className="dim-row">
          <div>
            <Label className="field-label">Width</Label>
            <Input
              type="number"
              className="num-input h-[26px] font-mono text-xs"
              value={state.width}
              onChange={(e) => set({ width: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn("lock-btn", state.linked && "locked")}
            onClick={() => set({ linked: !state.linked })}
            title={state.linked ? "Unlock ratio" : "Lock ratio"}
          >
            <i className={`ti ${state.linked ? "ti-link" : "ti-link-off"}`} />
          </Button>
          <div>
            <Label className="field-label">Height</Label>
            <Input
              type="number"
              className="num-input h-[26px] font-mono text-xs"
              value={state.height}
              onChange={(e) => set({ height: e.target.value })}
            />
          </div>
        </div>
      </PanelSection>
      <PanelSection label="quality">
        <SliderField
          label="Compression"
          value={state.quality}
          onChange={(quality) => set({ quality })}
          min={10}
          max={100}
        />
      </PanelSection>
      <PanelSection label="output format">
        <FormatSelect value={state.format} onChange={(format) => set({ format })} options={FORMAT_OPTIONS} />
        <EstimateRow quality={state.quality} format={state.format} />
      </PanelSection>
    </>
  )
}
