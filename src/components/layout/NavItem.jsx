import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function NavItem({ icon, label, active, disabled, onClick, soon, tooltip }) {
  const button = (
    <button
      type="button"
      className={cn("nav-item", active && "active", disabled && "disabled")}
      onClick={disabled ? undefined : onClick}
    >
      <i className={`ti ${icon}`} />
      <span>{label}</span>
      {soon && (
        <Badge
          variant="outline"
          className="soon-pill ml-auto border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] text-[var(--color-warn-fg)]"
        >
          soon
        </Badge>
      )}
    </button>
  )

  if (disabled && tooltip) {
    return (
      <div className="tooltip-wrap">
        {button}
        <div className="tooltip">{tooltip}</div>
      </div>
    )
  }

  return button
}
