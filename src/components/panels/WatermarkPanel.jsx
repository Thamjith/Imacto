import { Input } from "@/components/ui/input"
import { ChipGroup } from "@/components/common/ChipGroup"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"

const POSITIONS = ["TL", "T", "TR", "L", "C", "R", "BL", "B", "BR"]

export function WatermarkPanel({ state, set }) {
  return (
    <>
      <PanelSection label="text">
        <Input
          className="text-input h-[30px] text-xs"
          value={state.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="© your name"
        />
      </PanelSection>
      <PanelSection label="position">
        <ChipGroup options={POSITIONS} value={state.position} onChange={(position) => set({ position })} />
      </PanelSection>
      <PanelSection label="opacity">
        <SliderField
          label="Opacity"
          value={state.opacity}
          onChange={(opacity) => set({ opacity })}
          min={10}
          max={100}
        />
      </PanelSection>
      <PanelSection label="size">
        <SliderField
          label="Text size"
          value={state.size}
          onChange={(size) => set({ size })}
          min={8}
          max={96}
          unit="px"
        />
      </PanelSection>
    </>
  )
}
