import { cn } from "@/lib/utils"

const SWATCHES = [
  { id: "transparent", checker: true },
  { id: "white", style: { background: "#fff" } },
  { id: "black", style: { background: "#000" } },
  { id: "blur", style: { background: "linear-gradient(135deg,#5a6cf5,#22b5a8)" } },
]

export function ColorSwatches({ value, onChange, options = SWATCHES }) {
  return (
    <div className="swatch-row">
      {options.map((swatch) => (
        <button
          key={swatch.id}
          type="button"
          className={cn(
            "swatch",
            swatch.checker && "checker",
            value === swatch.id && "active"
          )}
          style={swatch.style}
          onClick={() => onChange(swatch.id)}
          aria-label={swatch.id}
        />
      ))}
    </div>
  )
}
