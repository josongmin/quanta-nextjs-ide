import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  OG_LOCALES,
  OG_SIZES,
  OG_TEMPLATES,
  type OgLocale,
  type OgSizeId,
  type OgTemplateId,
} from '../helpers';

interface ToolbarProps {
  templateId: OgTemplateId;
  onTemplateChange(id: OgTemplateId): void;
  locale: OgLocale;
  onLocaleChange(l: OgLocale): void;
  size: OgSizeId;
  onSizeChange(s: OgSizeId): void;
}

export function Toolbar({
  templateId,
  onTemplateChange,
  locale,
  onLocaleChange,
  size,
  onSizeChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
      <span className="text-caps text-ink-3">Template</span>
      <div className="flex items-center gap-1">
        {OG_TEMPLATES.map((t) => (
          <ToggleChip
            key={t.id}
            active={t.id === templateId}
            onClick={() => onTemplateChange(t.id)}
          >
            {t.label}
          </ToggleChip>
        ))}
      </div>
      <span className="ml-2 text-caps text-ink-3">Locale</span>
      <div className="flex items-center gap-1">
        {OG_LOCALES.map((l) => (
          <ToggleChip key={l} active={l === locale} onClick={() => onLocaleChange(l)}>
            {l}
          </ToggleChip>
        ))}
      </div>
      <span className="ml-2 text-caps text-ink-3">Size</span>
      <div className="flex items-center gap-1">
        {OG_SIZES.map((s) => (
          <ToggleChip key={s.id} active={s.id === size} onClick={() => onSizeChange(s.id)}>
            {s.label}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}
