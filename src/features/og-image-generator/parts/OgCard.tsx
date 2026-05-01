import {
  bgFill,
  findSize,
  findTemplate,
  inkColors,
  type OgState,
} from '../helpers';

export const PREVIEW_W = 520;

interface OgCardProps {
  state: OgState;
  width: number;
}

export function OgCard({ state, width }: OgCardProps) {
  const size = findSize(state.size);
  const aspect = size.h / size.w;
  const h = Math.round(width * aspect);
  const fill = bgFill(state.bgVariant);
  const ink = inkColors(state.bgVariant);
  const padding = Math.round(width * 0.055);
  const titleSize = Math.round(width * 0.062);
  const subSize = Math.round(width * 0.028);
  const badgeSize = Math.round(width * 0.022);

  return (
    <svg
      viewBox={`0 0 ${size.w} ${size.h}`}
      width={width}
      height={h}
      role="img"
      aria-label="Open Graph preview"
      className="block rounded-sm border border-line shadow-pop"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`bg-${state.bgVariant}`} x1="0" y1="0" x2="1" y2="1">
          {fill.stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <radialGradient id={`bgr-${state.bgVariant}`} cx="0.3" cy="0.3" r="0.7">
          {fill.stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </radialGradient>
        <pattern id="og-grid" width={32} height={32} patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width={size.w}
        height={size.h}
        fill={
          fill.type === 'linear'
            ? `url(#bg-${state.bgVariant})`
            : fill.type === 'radial'
              ? `url(#bgr-${state.bgVariant})`
              : fill.stops[0]!.color
        }
      />
      {state.bgVariant === 'grid' ? (
        <rect x="0" y="0" width={size.w} height={size.h} fill="url(#og-grid)" opacity="0.5" />
      ) : null}

      <g transform={`translate(${padding * (PREVIEW_W / width)}, ${padding * (PREVIEW_W / width)})`} />
      <g>
        <rect
          x={64}
          y={64}
          rx={36}
          ry={36}
          width={state.badge.length * 28 + 64}
          height={64}
          fill={state.accent}
        />
        <text
          x={64 + (state.badge.length * 28 + 64) / 2}
          y={64 + 42}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={28}
          fontWeight={600}
          fill="#ffffff"
          textAnchor="middle"
        >
          {state.badge}
        </text>
      </g>

      <text
        x={64}
        y={size.h - 200}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={titleSize * (size.w / width)}
        fontWeight={700}
        fill={ink.title}
      >
        {state.title.length > 28 ? state.title.slice(0, 28) + '…' : state.title}
      </text>

      <text
        x={64}
        y={size.h - 120}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={subSize * (size.w / width)}
        fontWeight={400}
        fill={ink.subtitle}
      >
        {state.subtitle.length > 60 ? state.subtitle.slice(0, 60) + '…' : state.subtitle}
      </text>

      {findTemplate(state.templateId).hasImageArea ? (
        <g>
          <rect
            x={size.w - 320}
            y={64}
            width={256}
            height={256}
            rx={16}
            fill="rgba(255,255,255,0.6)"
            stroke={state.accent}
            strokeOpacity={0.4}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <text
            x={size.w - 192}
            y={196}
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={20}
            fill={state.accent}
            textAnchor="middle"
            opacity={0.7}
          >
            image
          </text>
        </g>
      ) : null}

      <rect x="0" y={size.h - 12} width={size.w} height={12} fill={state.accent} />

      <g opacity="0">
        <line x1="0" y1={size.h / 2} x2={size.w} y2={size.h / 2} stroke="#0ea5e9" strokeDasharray="4 4" />
        <line x1={size.w / 2} y1="0" x2={size.w / 2} y2={size.h} stroke="#0ea5e9" strokeDasharray="4 4" />
      </g>
      <text
        x={size.w - 16}
        y={size.h - 24}
        fontFamily="ui-monospace, monospace"
        fontSize={16}
        fill={ink.subtitle}
        textAnchor="end"
        opacity={0.8}
      >
        {size.w}×{size.h} · {badgeSize}px
      </text>
    </svg>
  );
}
