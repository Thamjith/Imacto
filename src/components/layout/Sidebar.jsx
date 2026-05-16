import { IMAGE_TOOLS, VIDEO_TOOLS } from "@/constants/tools"
import { NavItem } from "./NavItem"

export function Sidebar({ active, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="nav-group">
        <div className="nav-label">image tools</div>
        {IMAGE_TOOLS.map((t) => (
          <NavItem
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={active === t.id}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">video tools</div>
        {VIDEO_TOOLS.map((t) => (
          <NavItem
            key={t.id}
            icon={t.icon}
            label={t.label}
            disabled
            soon
            tooltip="Video processing in development"
          />
        ))}
      </div>
    </aside>
  )
}
