import { Chip } from '@shared/ui';
import {
  OG_LOCALE_STRINGS,
  findSize,
  type OgLocale,
  type OgSizeId,
  type OgState,
} from '../helpers';
import { OgCard } from './OgCard';

interface VariantTileProps {
  state: OgState;
  sizeId: OgSizeId;
  locale: OgLocale;
}

export function VariantTile({ state, sizeId, locale }: VariantTileProps) {
  const t = OG_LOCALE_STRINGS[state.templateId][locale];
  const size = findSize(sizeId);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] text-ink-3">
        <span className="font-mono">{size.label}</span>
        <Chip tone="muted" size="xs">
          {locale}
        </Chip>
      </div>
      <OgCard
        state={{ ...state, size: sizeId, title: t.title, subtitle: t.subtitle, badge: t.badge }}
        width={170}
      />
    </div>
  );
}
