interface RelGraphProps {
  fromName: string;
  edges: ReadonlyArray<{ toTypeId: string; fieldName: string; cardinality: string }>;
}

export function RelationshipGraph({ fromName, edges }: RelGraphProps) {
  const w = 720;
  const cardW = 130;
  const cardH = 40;
  const yMid = 80;
  const xCenter = 70;
  const h = Math.max(140, edges.length * 60);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 block w-full" style={{ height: h }}>
      <defs>
        <marker
          id="cmd-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" className="fill-accent" />
        </marker>
      </defs>
      <rect
        x={xCenter - cardW / 2}
        y={yMid - cardH / 2}
        width={cardW}
        height={cardH}
        rx={4}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1}
      />
      <text
        x={xCenter}
        y={yMid + 4}
        textAnchor="middle"
        fontSize={12}
        className="fill-accent font-medium"
      >
        {fromName}
      </text>
      {edges.map((e, i) => {
        const targetY = 30 + i * 56;
        const targetX = w - cardW / 2 - 20;
        return (
          <g key={`${e.toTypeId}-${e.fieldName}`}>
            <line
              x1={xCenter + cardW / 2}
              y1={yMid}
              x2={targetX - cardW / 2}
              y2={targetY}
              className="stroke-accent"
              strokeWidth={1}
              markerEnd="url(#cmd-arrow)"
            />
            <text
              x={(xCenter + cardW / 2 + targetX - cardW / 2) / 2}
              y={(yMid + targetY) / 2 - 4}
              textAnchor="middle"
              fontSize={10}
              className="fill-ink-3"
            >
              {e.fieldName} · {e.cardinality}
            </text>
            <rect
              x={targetX - cardW / 2}
              y={targetY - cardH / 2}
              width={cardW}
              height={cardH}
              rx={4}
              className="fill-bg stroke-line"
              strokeWidth={1}
            />
            <text
              x={targetX}
              y={targetY + 4}
              textAnchor="middle"
              fontSize={12}
              className="fill-ink-1 font-medium"
            >
              {e.toTypeId}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
