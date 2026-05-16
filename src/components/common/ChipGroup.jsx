import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ChipGroup({ options, value, onChange, className }) {
  return (
    <div className={cn("chip-row", className)}>
      {options.map((option) => {
        const id = typeof option === "string" ? option : option.id
        const label = typeof option === "string" ? option : option.label
        const active = value === id
        return (
          <Button
            key={id}
            type="button"
            variant={active ? "secondary" : "outline"}
            size="sm"
            className={cn("chip h-[26px] px-2.5 text-xs", active && "chip-active")}
            onClick={() => onChange(id)}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
