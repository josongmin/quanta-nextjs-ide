import { Chip } from '@shared/ui';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  type BannerConfig,
  type Category,
} from '../helpers';

interface CategoryDescriptionsProps {
  config: BannerConfig;
  onUpdateDesc: (cat: Category, v: string) => void;
}

export function CategoryDescriptions({
  config,
  onUpdateDesc,
}: CategoryDescriptionsProps): JSX.Element {
  return (
    <div className="mt-3 rounded-sm border border-line bg-bg p-2">
      <div className="text-caps text-ink-3">Per-category descriptions</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <div className="flex items-center gap-1">
              <Chip tone={CATEGORY_TONE[cat]} size="xs">
                {CATEGORY_LABEL[cat]}
              </Chip>
              {cat === 'strictly-necessary' ? (
                <Chip tone="info" size="xs">
                  block until consent
                </Chip>
              ) : null}
            </div>
            <textarea
              value={config.perCategoryDescriptions[cat]}
              onChange={(e) => onUpdateDesc(cat, e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-sm border border-line bg-bg px-2 py-1 text-[11px] text-ink-1 focus:outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
