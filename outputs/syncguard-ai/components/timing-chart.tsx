"use client";

import type { TimingPoint } from "@/lib/timing";

type Series = {
  key: keyof TimingPoint;
  label: string;
  color: string;
  dashed?: boolean;
};

export function TimingChart({
  points,
  series,
  threshold,
  outageAt = 0,
}: {
  points: TimingPoint[];
  series: Series[];
  threshold?: number;
  outageAt?: number;
}) {
  const width = 960;
  const height = 340;
  const padding = { top: 24, right: 24, bottom: 42, left: 70 };
  const maxT = points.at(-1)?.t ?? 1;
  const allValues = points.flatMap((point) =>
    series.flatMap((item) => {
      const value = point[item.key];
      return typeof value === "number" ? [value] : [];
    }),
  );
  if (threshold) allValues.push(threshold, -threshold);
  const minY = Math.min(0, ...allValues);
  const maxY = Math.max(1, ...allValues);
  const rangeY = Math.max(maxY - minY, 1);
  const x = (t: number) =>
    padding.left + (t / maxT) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top +
    ((maxY - value) / rangeY) * (height - padding.top - padding.bottom);
  const ticks = Array.from({ length: 5 }, (_, index) =>
    minY + (index * rangeY) / 4,
  );
  const pathFor = (key: keyof TimingPoint) => {
    let active = false;
    return points
      .map((point) => {
        const value = point[key];
        if (typeof value !== "number") {
          active = false;
          return "";
        }
        const command = active ? "L" : "M";
        active = true;
        return `${command}${x(point.t).toFixed(2)},${y(value).toFixed(2)}`;
      })
      .join(" ");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
        {series.map((item) => (
          <span key={String(item.key)} className="flex items-center gap-2">
            <span className="h-0.5 w-5" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
        {threshold ? (
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-rose-400" />
            ± threshold
          </span>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Timing error in nanoseconds over elapsed time"
        className="h-auto w-full overflow-visible"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,.08)" />
            <text x={padding.left - 12} y={y(tick) + 4} textAnchor="end" fill="#7e8e9d" fontSize="12" fontFamily="var(--font-mono)">
              {Math.round(tick)}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <text key={fraction} x={x(maxT * fraction)} y={height - 12} textAnchor="middle" fill="#7e8e9d" fontSize="12" fontFamily="var(--font-mono)">
            {Math.round(maxT * fraction)}s
          </text>
        ))}
        {outageAt > 0 ? (
          <g>
            <line x1={x(outageAt)} x2={x(outageAt)} y1={padding.top} y2={height - padding.bottom} stroke="#d2fc63" strokeDasharray="5 6" opacity=".65" />
            <text x={x(outageAt) + 8} y={padding.top + 12} fill="#d2fc63" fontSize="12">GNSS loss</text>
          </g>
        ) : null}
        {threshold
          ? [threshold, -threshold].map((value) => (
              <line key={value} x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} stroke="#fb7185" strokeDasharray="4 6" opacity=".75" />
            ))
          : null}
        {series.map((item) => (
          <path key={String(item.key)} d={pathFor(item.key)} fill="none" stroke={item.color} strokeWidth={item.key === "truth" ? 2.5 : 2} strokeDasharray={item.dashed ? "6 5" : undefined} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <text x="16" y={height / 2} fill="#7e8e9d" fontSize="12" transform={`rotate(-90 16 ${height / 2})`}>
          phase error (ns)
        </text>
      </svg>
    </div>
  );
}
