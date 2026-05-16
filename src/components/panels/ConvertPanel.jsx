import { ChipGroup } from "@/components/common/ChipGroup"
import { ColorSwatches } from "@/components/common/ColorSwatches"
import { EstimateRow } from "@/components/common/EstimateRow"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jpg", label: "JPG" },
  { value: "gif", label: "GIF" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
]

const PROFILES = ["sRGB", "Display P3", "Adobe RGB"]
const BG_OPTIONS = [
  { id: "white", style: { background: "#fff" } },
  { id: "black", style: { background: "#000" } },
  { id: "transparent", checker: true },
]

export function ConvertPanel({ state, set }) {
  return (
    <>
      <PanelSection label="target format">
        <FormatSelect value={state.format} onChange={(format) => set({ format })} options={FORMAT_OPTIONS} />
        <div className="field-help">Source: JPG · sRGB</div>
      </PanelSection>
      <PanelSection label="color profile">
        <ChipGroup options={PROFILES} value={state.profile} onChange={(profile) => set({ profile })} />
      </PanelSection>
      <PanelSection label="background">
        <p className="mb-2 text-xs text-[var(--color-text-secondary)]">For transparent → JPG</p>
        <ColorSwatches value={state.bg} onChange={(bg) => set({ bg })} options={BG_OPTIONS} />
      </PanelSection>
      <PanelSection label="size comparison">
        <EstimateRow quality={85} format={state.format} />
      </PanelSection>
    </>
  )
}
