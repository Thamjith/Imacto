import { Slider } from "@/components/ui/slider"

export function SliderField({ label, value, onChange, min = 0, max = 100, unit = "%", help }) {
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
        onValueChange={([next]) => onChange(next)}
        className="my-2"
      />
      {help ? <div className="field-help">{help}</div> : null}
    </div>
  )
}
