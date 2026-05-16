import { ChipGroup } from "@/components/common/ChipGroup"
import { ColorSwatches } from "@/components/common/ColorSwatches"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"

const METHODS = ["Auto", "Subject", "Color"]
const FORMAT_OPTIONS = [
  { value: "png", label: "PNG (recommended)" },
  { value: "webp", label: "WebP" },
]

export function BgRemovePanel({ state, set }) {
  return (
    <>
      <PanelSection label="method">
        <ChipGroup options={METHODS} value={state.method} onChange={(method) => set({ method })} />
        <div className="field-help">Auto detects the primary subject using an on-device model.</div>
      </PanelSection>
      <PanelSection label="edge refinement">
        <SliderField
          label="Feather"
          value={state.feather}
          onChange={(feather) => set({ feather })}
          min={0}
          max={20}
          unit="px"
        />
      </PanelSection>
      <PanelSection label="replace with">
        <ColorSwatches value={state.bg} onChange={(bg) => set({ bg })} />
      </PanelSection>
      <PanelSection label="output format">
        <FormatSelect value="png" onChange={() => {}} options={FORMAT_OPTIONS} />
      </PanelSection>
    </>
  )
}
