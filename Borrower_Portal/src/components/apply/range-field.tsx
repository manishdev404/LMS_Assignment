interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}

export function RangeField({ id, label, value, min, max, step, onChange, format }: RangeFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <output htmlFor={id} className="text-xl font-bold tabular-nums text-slate-900">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
