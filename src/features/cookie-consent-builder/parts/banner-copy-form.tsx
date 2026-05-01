import { type BannerConfig } from '../helpers';

interface BannerCopyFormProps {
  config: BannerConfig;
  onUpdate: (patch: Partial<BannerConfig>) => void;
}

export function BannerCopyForm({
  config,
  onUpdate,
}: BannerCopyFormProps): JSX.Element {
  return (
    <div className="rounded-sm border border-line bg-bg p-2">
      <div className="text-caps text-ink-3">Banner copy</div>
      <label className="mt-2 block text-[10px] uppercase tracking-caps text-ink-3">
        headline
      </label>
      <input
        value={config.headline}
        onChange={(e) => onUpdate({ headline: e.target.value })}
        className="mt-1 w-full rounded-sm border border-line bg-bg px-2 py-1 text-[12px] text-ink-1 focus:outline-none focus:border-accent"
      />
      <label className="mt-2 block text-[10px] uppercase tracking-caps text-ink-3">
        body
      </label>
      <textarea
        value={config.body}
        onChange={(e) => onUpdate({ body: e.target.value })}
        rows={3}
        className="mt-1 w-full rounded-sm border border-line bg-bg px-2 py-1 text-[11px] text-ink-1 focus:outline-none focus:border-accent"
      />

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.acceptAll}
            onChange={(e) => onUpdate({ acceptAll: e.target.checked })}
          />
          Show "Accept all"
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.rejectAll}
            onChange={(e) => onUpdate({ rejectAll: e.target.checked })}
          />
          Show "Reject all"
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.customize}
            onChange={(e) => onUpdate({ customize: e.target.checked })}
          />
          Show "Customize"
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.geoTarget}
            onChange={(e) => onUpdate({ geoTarget: e.target.checked })}
          />
          Geo-target by region
        </label>
      </div>
    </div>
  );
}
