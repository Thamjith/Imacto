import { type ComponentType, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { TOOL_META, type ToolId, type ToolState } from "@/constants/tools"
import { type LoadedImage } from "@/lib/imageUpload"
import { BgRemovePanel } from "./BgRemovePanel"
import { CompressPanel } from "./CompressPanel"
import { ConvertPanel } from "./ConvertPanel"
import { CropPanel } from "./CropPanel"
import { RotatePanel } from "./RotatePanel"
import { WatermarkPanel } from "./WatermarkPanel"

const PANELS = {
  crop: CropPanel,
  compress: CompressPanel,
  convert: ConvertPanel,
  rotate: RotatePanel,
  bgremove: BgRemovePanel,
  watermark: WatermarkPanel,
} satisfies Record<ToolId, ComponentType<never>>

interface RightPanelProps {
  tool: ToolId
  toolState: ToolState
  setToolState: Dispatch<SetStateAction<ToolState>>
  onExport: () => void
  disabled?: boolean
  exporting?: boolean
  image: LoadedImage | null
}

export function RightPanel({
  tool,
  toolState,
  setToolState,
  onExport,
  disabled,
  exporting,
  image,
}: RightPanelProps) {
  const meta = TOOL_META[tool]
  // Dynamic per-tool dispatch: each panel has a distinct, incompatible props
  // shape, so the lookup is widened and the props are built per-branch below.
  const Panel = PANELS[tool] as unknown as ComponentType<Record<string, unknown>>

  const update =
    <K extends ToolId>(key: K) =>
    (patch: Partial<ToolState[K]>) =>
      setToolState((s) => ({ ...s, [key]: { ...s[key], ...patch } }) as ToolState)

  const panelProps: Record<string, unknown> =
    tool === "crop"
      ? {
          state: toolState.crop,
          set: update("crop"),
          imageWidth: image?.width,
          imageHeight: image?.height,
        }
      : tool === "compress"
        ? { state: toolState.compress, set: update("compress"), image }
        : { state: toolState[tool], set: update(tool), image }

  return (
    <aside className="rightpanel">
      <div className="rp-header">
        <div className="rp-title">
          <i className={`ti ${meta.icon}`} />
          <span>{meta.title}</span>
        </div>
        <div className="rp-subtitle">{meta.sub}</div>
      </div>
      <div className="rp-body">
        <Panel {...panelProps} />
      </div>
      <div className="rp-footer">
        <Button className="btn-primary w-full" onClick={onExport} disabled={disabled || exporting}>
          <i className="ti ti-download" />
          {exporting ? "Exporting…" : "Export file"}
        </Button>
      </div>
    </aside>
  )
}
