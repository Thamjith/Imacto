import { Button } from "@/components/ui/button"
import { TOOL_META } from "@/constants/tools"
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
}

export function RightPanel({ tool, toolState, setToolState, onExport, disabled, exporting, image }) {
  const meta = TOOL_META[tool]
  const Panel = PANELS[tool]
  const update = (key) => (patch) => setToolState((s) => ({ ...s, [key]: { ...s[key], ...patch } }))

  const panelProps =
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
      <div className="rp-body">{Panel && <Panel {...panelProps} />}</div>
      <div className="rp-footer">
        <Button className="btn-primary w-full" onClick={onExport} disabled={disabled || exporting}>
          <i className="ti ti-download" />
          {exporting ? "Exporting…" : "Export file"}
        </Button>
      </div>
    </aside>
  )
}
