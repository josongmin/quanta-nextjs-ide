import {
  OG_LOCALES,
  OG_SIZES,
  findSize,
  type OgLocale,
  type OgSizeId,
  type OgState,
} from '../helpers';
import { OgCard, PREVIEW_W } from './OgCard';
import { VariantTile } from './VariantTile';

interface PreviewPanelProps {
  state: OgState;
  size: OgSizeId;
  locale: OgLocale;
}

export function PreviewPanel({ state, size, locale }: PreviewPanelProps) {
  return (
    <div className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
      <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
        <span>Preview</span>
        <span className="font-mono text-[10px] text-ink-3">
          {findSize(size).w}×{findSize(size).h}
        </span>
      </header>
      <div className="group relative inline-block">
        <OgCard state={state} width={PREVIEW_W} />
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center group-hover:flex">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-accent/40" />
          <div className="absolute bottom-0 top-0 left-1/2 w-px bg-accent/40" />
          <span className="absolute left-1 top-1 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-3">
            ruler
          </span>
        </div>
      </div>

      <header className="mb-2 mt-4 text-caps text-ink-3">Variants</header>
      <div className="grid grid-cols-4 gap-2">
        {OG_SIZES.filter((s) => s.id !== size).map((s) => (
          <VariantTile key={s.id} state={state} sizeId={s.id} locale={locale} />
        ))}
      </div>

      <header className="mb-2 mt-4 text-caps text-ink-3">Locale variants</header>
      <div className="grid grid-cols-4 gap-2">
        {OG_LOCALES.filter((l) => l !== locale).map((l) => (
          <VariantTile key={l} state={state} sizeId={size} locale={l} />
        ))}
      </div>
    </div>
  );
}
