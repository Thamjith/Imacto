import { Badge } from "@/components/ui/badge"

export function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="mark">
          <i className="ti ti-photo-edit" />
        </span>
        <span className="name">
          <em>ima</em>
          <em>cto</em>
        </span>
        <span className="sub">studio</span>
      </div>
      <div className="topbar-right">
        <Badge variant="secondary" className="badge-muted h-6 gap-1.5 rounded-full px-2.5 font-normal">
          <span className="dot" />
          Image only · video coming soon
        </Badge>
        <div className="avatar">RM</div>
      </div>
    </header>
  )
}
