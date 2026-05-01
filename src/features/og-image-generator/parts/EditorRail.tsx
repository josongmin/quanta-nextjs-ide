import { cn } from '@shared/lib/cn';
import {
  BG_SWATCHES,
  type OgBgVariant,
  type OgTemplate,
} from '../helpers';

interface EditorRailProps {
  title: string;
  onTitleChange(v: string): void;
  subtitle: string;
  onSubtitleChange(v: string): void;
  badge: string;
  onBadgeChange(v: string): void;
  accent: string;
  onAccentChange(v: string): void;
  bgVariant: OgBgVariant;
  onBgVariantChange(v: OgBgVariant): void;
  tpl: OgTemplate;
}

export function EditorRail({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  badge,
  onBadgeChange,
  accent,
  onAccentChange,
  bgVariant,
  onBgVariantChange,
  tpl,
}: EditorRailProps) {
  return (
    <aside className="min-w-0 max-h-[68vh] overflow-y-auto p-3 space-y-3">
      <div className="space-y-1">
        <label className="text-caps text-ink-3">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-caps text-ink-3">Subtitle</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          className="block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-caps text-ink-3">Badge</label>
        <input
          type="text"
          value={badge}
          onChange={(e) => onBadgeChange(e.target.value)}
          className="block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-caps text-ink-3">Accent color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accent}
            onChange={(e) => onAccentChange(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded-sm border border-line bg-bg"
          />
          <input
            type="text"
            value={accent}
            onChange={(e) => onAccentChange(e.target.value)}
            className="flex-1 rounded-sm border border-line bg-bg px-2 py-1 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-caps text-ink-3">Background</label>
        <div className="grid grid-cols-5 gap-1">
          {BG_SWATCHES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onBgVariantChange(s.id)}
              title={s.label}
              className={cn(
                'h-10 rounded-sm border border-line transition-all hover:scale-105',
                bgVariant === s.id && 'ring-2 ring-accent border-accent',
              )}
              style={{ background: s.preview }}
              aria-label={s.label}
            />
          ))}
        </div>
        <p className="text-[10px] text-ink-3">{BG_SWATCHES.find((s) => s.id === bgVariant)?.label}</p>
      </div>
      <div className="space-y-1 pt-1">
        <label className="text-caps text-ink-3">Template info</label>
        <div className="rounded-sm border border-line bg-bg-subtle/40 p-2 text-[11px] text-ink-2">
          <div>font: {tpl.font}</div>
          <div>image area: {tpl.hasImageArea ? 'yes' : 'no'}</div>
          <div className="text-ink-3 mt-1">Layout shifts based on template id.</div>
        </div>
      </div>
    </aside>
  );
}
