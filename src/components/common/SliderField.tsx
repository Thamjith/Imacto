import { Slider } from "@/components/ui/slider"

interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
  help?: string
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = "%",
  help,
}: SliderFieldProps) {
  return (
    <div>
      <div className="slider-head">
        <span className="k">{label}</span>
        <span className="v">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        value={[value]}
        onValueChange={(val) => onChange(Array.isArray(val) ? val[0] : val)}
        className="my-2"
      />
      {help ? <div className="field-help">{help}</div> : null}
    </div>
  )
}
