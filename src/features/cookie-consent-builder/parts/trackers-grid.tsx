import { Chip } from '@shared/ui';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  TRACKERS,
  type BannerConfig,
  type Category,
} from '../helpers';

interface TrackersGridProps {
  config: BannerConfig;
  trackersByCat: Record<Category, ReadonlyArray<typeof TRACKERS[number]>>;
  onToggleTracker: (id: string) => void;
}

export function TrackersGrid({
  config,
  trackersByCat,
  onToggleTracker,
}: TrackersGridProps): JSX.Element {
  return (
    <div className="mt-3">
      <h3 className="text-caps text-ink-3">Trackers</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="rounded-sm border border-line bg-bg p-2"
          >
            <div className="flex items-center justify-between">
              <Chip tone={CATEGORY_TONE[cat]} size="xs">
                {CATEGORY_LABEL[cat]}
              </Chip>
              <span className="text-[10px] text-ink-3">
                {trackersByCat[cat].length}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {trackersByCat[cat].map((t) => {
                const enabled = config.enabledTrackers.includes(t.id);
                const locked = cat === 'strictly-necessary';
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-2 rounded-sm border border-line bg-bg-subtle/40 px-2 py-1 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={enabled || locked}
                      disabled={locked}
                      onChange={() => onToggleTracker(t.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-ink-1">
                          {t.vendor}
                        </span>
                        <span className="text-ink-3">·</span>
                        <span className="text-ink-3">{t.expires}</span>
                      </div>
                      <div className="text-[10px] text-ink-3">
                        {t.purpose}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
