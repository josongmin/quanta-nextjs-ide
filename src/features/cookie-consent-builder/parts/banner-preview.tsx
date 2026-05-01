import { type BannerStyle, type Region } from '../helpers';

const PREVIEW_W = 360;
const PREVIEW_H = 200;

export function BannerPreview({
  style,
  region,
}: {
  style: BannerStyle;
  region: Region;
}) {
  return (
    <svg
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="w-full"
      role="img"
      aria-label={`${style} banner preview`}
    >
      <rect width={PREVIEW_W} height={PREVIEW_H} className="fill-bg-subtle" rx={4} />
      <rect
        x={20}
        y={14}
        width={PREVIEW_W - 40}
        height={6}
        rx={1}
        className="fill-line"
      />
      <rect
        x={20}
        y={26}
        width={PREVIEW_W - 80}
        height={4}
        rx={1}
        className="fill-line"
      />
      {style === 'bottom-sheet' ? (
        <g>
          <rect
            x={6}
            y={PREVIEW_H - 70}
            width={PREVIEW_W - 12}
            height={62}
            rx={4}
            className="fill-bg stroke-line"
          />
          <text
            x={14}
            y={PREVIEW_H - 52}
            className="fill-ink-1 text-[10px] font-semibold"
          >
            We use cookies · {region}
          </text>
          <text x={14} y={PREVIEW_H - 40} className="fill-ink-3 text-[8px]">
            Analytics, marketing, and functional categories.
          </text>
          <rect
            x={14}
            y={PREVIEW_H - 30}
            width={62}
            height={16}
            rx={2}
            className="fill-accent"
          />
          <text
            x={45}
            y={PREVIEW_H - 19}
            textAnchor="middle"
            className="fill-white text-[8px]"
          >
            Accept
          </text>
          <rect
            x={82}
            y={PREVIEW_H - 30}
            width={62}
            height={16}
            rx={2}
            className="fill-bg stroke-line"
          />
          <text
            x={113}
            y={PREVIEW_H - 19}
            textAnchor="middle"
            className="fill-ink-1 text-[8px]"
          >
            Reject
          </text>
          <rect
            x={150}
            y={PREVIEW_H - 30}
            width={72}
            height={16}
            rx={2}
            className="fill-bg stroke-line"
          />
          <text
            x={186}
            y={PREVIEW_H - 19}
            textAnchor="middle"
            className="fill-ink-1 text-[8px]"
          >
            Customize
          </text>
        </g>
      ) : null}
      {style === 'center-modal' ? (
        <g>
          <rect
            x={PREVIEW_W / 2 - 110}
            y={PREVIEW_H / 2 - 60}
            width={220}
            height={120}
            rx={4}
            className="fill-bg stroke-line"
          />
          <text
            x={PREVIEW_W / 2}
            y={PREVIEW_H / 2 - 40}
            textAnchor="middle"
            className="fill-ink-1 text-[10px] font-semibold"
          >
            Cookie preferences · {region}
          </text>
          <rect
            x={PREVIEW_W / 2 - 100}
            y={PREVIEW_H / 2 - 30}
            width={200}
            height={32}
            rx={2}
            className="fill-bg-subtle"
          />
          <rect
            x={PREVIEW_W / 2 - 100}
            y={PREVIEW_H / 2 + 8}
            width={60}
            height={16}
            rx={2}
            className="fill-accent"
          />
          <rect
            x={PREVIEW_W / 2 - 32}
            y={PREVIEW_H / 2 + 8}
            width={60}
            height={16}
            rx={2}
            className="fill-bg stroke-line"
          />
          <rect
            x={PREVIEW_W / 2 + 36}
            y={PREVIEW_H / 2 + 8}
            width={64}
            height={16}
            rx={2}
            className="fill-bg stroke-line"
          />
        </g>
      ) : null}
      {style === 'corner-tile' ? (
        <g>
          <rect
            x={PREVIEW_W - 142}
            y={PREVIEW_H - 80}
            width={130}
            height={70}
            rx={4}
            className="fill-bg stroke-line"
          />
          <text
            x={PREVIEW_W - 134}
            y={PREVIEW_H - 64}
            className="fill-ink-1 text-[9px] font-semibold"
          >
            Cookies · {region}
          </text>
          <text x={PREVIEW_W - 134} y={PREVIEW_H - 52} className="fill-ink-3 text-[8px]">
            Manage preferences
          </text>
          <rect
            x={PREVIEW_W - 134}
            y={PREVIEW_H - 38}
            width={50}
            height={14}
            rx={2}
            className="fill-accent"
          />
          <rect
            x={PREVIEW_W - 80}
            y={PREVIEW_H - 38}
            width={56}
            height={14}
            rx={2}
            className="fill-bg stroke-line"
          />
        </g>
      ) : null}
    </svg>
  );
}
