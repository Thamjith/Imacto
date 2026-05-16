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

export function RightPanel({ tool, toolState, setToolState, onExport, disabled }) {
  const meta = TOOL_META[tool]
  const Panel = PANELS[tool]
  const update = (key) => (patch) => setToolState((s) => ({ ...s, [key]: { ...s[key], ...patch } }))

  return (
    <aside className="rightpanel">
      <div className="rp-header">
        <div className="rp-title">
          <i className={`ti ${meta.icon}`} />
          <span>{meta.title}</span>
        </div>
        <div className="rp-subtitle">{meta.sub}</div>
      </div>
      <div className="rp-body">{Panel && <Panel state={toolState[tool]} set={update(tool)} />}</div>
      <div className="rp-footer">
        <Button className="btn-primary w-full" onClick={onExport} disabled={disabled}>
          <i className="ti ti-download" />
          Export file
        </Button>
      </div>
    </aside>
  )
}
