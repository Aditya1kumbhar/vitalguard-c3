interface VitalGaugeProps {
  label: string;
  value: number;
  unit: string;
  minSafe: number;
  maxSafe: number;
}

export default function VitalGauge({
  label,
  value,
  unit,
  minSafe,
  maxSafe,
}: VitalGaugeProps) {
  const isOutOfRange = value < minSafe || value > maxSafe;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 flex flex-col gap-2">
      <span className="text-slate-400 text-sm">{label}</span>
      <span
        className={`text-4xl font-bold ${
          isOutOfRange ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {value}
        <span className="text-lg ml-1 text-slate-500">{unit}</span>
      </span>
    </div>
  );
}
