interface DonutProps {
  slices: ReadonlyArray<{ value: number; color: string; label: string }>;
}

export function Donut({ slices }: DonutProps) {
  const size = 96;
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="License breakdown"
    >
      <circle cx={cx} cy={cy} r={r} fill="rgb(241 245 249)" />
      {slices.map((s) => {
        const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += s.value;
        const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + Math.cos(start) * r;
        const y1 = cy + Math.sin(start) * r;
        const x2 = cx + Math.cos(end) * r;
        const y2 = cy + Math.sin(end) * r;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        return <path key={s.label} d={d} fill={s.color} opacity={0.9} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-ink-1 text-[11px]">
        {total}
      </text>
    </svg>
  );
}
