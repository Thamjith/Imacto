import { type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChipGroup } from "@/components/common/ChipGroup"
import { EstimateRow } from "@/components/common/EstimateRow"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"
import {
  aspectRatioFromLabel,
  centerCropWithAspect,
  linkedDimensionPair,
  outputAspectRatio,
  parseDimension,
} from "@/lib/cropGeometry"
import { cn } from "@/lib/utils"
import { type CropToolState } from "@/constants/tools"

const ASPECTS = ["Free", "1:1", "16:9", "4:3", "3:2"]
const FORMAT_OPTIONS = [
  { value: "keep", label: "Keep original" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "gif", label: "GIF" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
]

interface CropPanelProps {
  state: CropToolState
  set: (patch: Partial<CropToolState>) => void
  imageWidth?: number
  imageHeight?: number
}

export function CropPanel({ state, set, imageWidth, imageHeight }: CropPanelProps) {
  const applyAspect = (aspect: string) => {
    if (!imageWidth || !imageHeight) {
      set({ aspect })
      return
    }
    const ratio = aspectRatioFromLabel(aspect)
    const region = centerCropWithAspect(imageWidth, imageHeight, ratio)
    const patch: Partial<CropToolState> = { aspect, region }
    if (state.linked) {
      const outRatio = ratio ?? region.width / region.height
      Object.assign(patch, linkedDimensionPair(region.width, outRatio))
    } else {
      patch.width = region.width
      patch.height = region.height
    }
    set(patch)
  }

  const onWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const width = e.target.value
    if (state.linked) {
      const ratio = outputAspectRatio(state)
      const { height } = linkedDimensionPair(width, ratio)
      set({ width, height })
    } else {
      set({ width })
    }
  }

  const onHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const height = e.target.value
    if (state.linked) {
      const ratio = outputAspectRatio(state)
      const w = parseDimension(height, 1)
      const width = Math.max(1, Math.round(w * ratio))
      set({ width, height })
    } else {
      set({ height })
    }
  }

  const resetCrop = () => {
    if (!imageWidth || !imageHeight) return
    const ratio = aspectRatioFromLabel(state.aspect)
    const region = centerCropWithAspect(imageWidth, imageHeight, ratio)
    set({
      region,
      width: region.width,
      height: region.height,
    })
  }

  return (
    <>
      <PanelSection label="aspect ratio">
        <ChipGroup options={ASPECTS} value={state.aspect} onChange={applyAspect} />
      </PanelSection>
      <PanelSection label="dimensions (px)">
        <div className="dim-row">
          <div>
            <Label className="field-label">Width</Label>
            <Input
              type="number"
              min={1}
              className="num-input h-[26px] font-mono text-xs"
              value={state.width}
              onChange={onWidthChange}
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
              min={1}
              className="num-input h-[26px] font-mono text-xs"
              value={state.height}
              onChange={onHeightChange}
            />
          </div>
        </div>
        <p className="field-help mt-2">Output size after crop. Drag handles on the preview to adjust the crop area.</p>
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
      <PanelSection label="crop area">
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={resetCrop}>
          <i className="ti ti-refresh" />
          Reset crop to image
        </Button>
      </PanelSection>
    </>
  )
}
