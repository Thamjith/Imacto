import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChipGroup } from "@/components/common/ChipGroup"
import { EstimateRow } from "@/components/common/EstimateRow"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"

const PRESETS = ["Lossless", "Balanced", "Smallest"]

export function CompressPanel({ state, set, image }) {
  return (
    <>
      <PanelSection label="preset">
        <ChipGroup
          options={PRESETS}
          value={state.preset}
          onChange={(preset) =>
            set({
              preset,
              quality: preset === "Lossless" ? 100 : preset === "Balanced" ? 80 : 55,
            })
          }
        />
      </PanelSection>
      <PanelSection label="quality">
        <SliderField
          label="Quality"
          value={state.quality}
          onChange={(quality) => set({ quality, preset: "Custom" })}
          min={10}
          max={100}
          help="Higher quality keeps more detail but a larger file; lower quality means more compression and a smaller file."
        />
      </PanelSection>
      <PanelSection label="strip metadata">
        <div className="row-between">
          <Label className="text-xs font-normal">Remove EXIF data</Label>
          <Switch checked={state.stripExif} onCheckedChange={(stripExif) => set({ stripExif })} />
        </div>
        <div className="field-help">Clears camera, location and timestamp.</div>
      </PanelSection>
      <PanelSection label="estimated size">
        <EstimateRow quality={state.quality} format="keep" originalBytes={image?.size} />
      </PanelSection>
    </>
  )
}
