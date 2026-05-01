import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import {
  OG_LOCALE_STRINGS,
  buildOgRoute,
  findSize,
  findTemplate,
  type OgBgVariant,
  type OgLocale,
  type OgSizeId,
  type OgState,
  type OgTemplateId,
} from './helpers';
import { EditorRail } from './parts/EditorRail';
import { PreviewPanel } from './parts/PreviewPanel';
import { Toolbar } from './parts/Toolbar';

export function OgImageGeneratorOverlay() {
  const open = useUiStore((s) => s.overlays.ogImageGenerator.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [templateId, setTemplateId] = useState<OgTemplateId>('product');
  const [locale, setLocale] = useState<OgLocale>('EN');
  const [size, setSize] = useState<OgSizeId>('1200x630');
  const tpl = useMemo(() => findTemplate(templateId), [templateId]);
  const localized = OG_LOCALE_STRINGS[templateId][locale];
  const [title, setTitle] = useState(localized.title);
  const [subtitle, setSubtitle] = useState(localized.subtitle);
  const [badge, setBadge] = useState(localized.badge);
  const [accent, setAccent] = useState<string>(tpl.accent);
  const [bgVariant, setBgVariant] = useState<OgBgVariant>(tpl.bgVariant);

  function pickTemplate(id: OgTemplateId) {
    const next = findTemplate(id);
    const ls = OG_LOCALE_STRINGS[id][locale];
    setTemplateId(id);
    setTitle(ls.title);
    setSubtitle(ls.subtitle);
    setBadge(ls.badge);
    setAccent(next.accent);
    setBgVariant(next.bgVariant);
  }

  function pickLocale(l: OgLocale) {
    setLocale(l);
    const ls = OG_LOCALE_STRINGS[templateId][l];
    setTitle(ls.title);
    setSubtitle(ls.subtitle);
    setBadge(ls.badge);
  }

  const state: OgState = useMemo(
    () => ({ templateId, locale, size, title, subtitle, badge, accent, bgVariant }),
    [templateId, locale, size, title, subtitle, badge, accent, bgVariant],
  );
  const code = useMemo(() => {
    const s = findSize(size);
    return buildOgRoute(state, s.w, s.h);
  }, [state, size]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('ogImageGenerator')}
      title={
        <span className="flex items-center gap-2">
          <span>OG image generator</span>
          <Chip tone="accent" size="xs">
            {tpl.label}
          </Chip>
        </span>
      }
      subtitle={`opengraph-image.tsx · ${findSize(size).label} · ${locale}`}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            edge runtime · ImageResponse
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Exported preview as PNG (mock)')}
          >
            Export PNG
          </Button>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast.success('Generated route', {
                description: `app/${templateId}/opengraph-image.tsx`,
              })
            }
          >
            Generate route
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() => toast('Opened unfurl preview (mock)')}
          >
            Test in unfurl preview
          </Button>
        </>
      }
    >
      <Toolbar
        templateId={templateId}
        onTemplateChange={pickTemplate}
        locale={locale}
        onLocaleChange={pickLocale}
        size={size}
        onSizeChange={setSize}
      />

      <div className="grid grid-cols-[300px_1fr_280px] divide-x divide-line">
        <EditorRail
          title={title}
          onTitleChange={setTitle}
          subtitle={subtitle}
          onSubtitleChange={setSubtitle}
          badge={badge}
          onBadgeChange={setBadge}
          accent={accent}
          onAccentChange={setAccent}
          bgVariant={bgVariant}
          onBgVariantChange={setBgVariant}
          tpl={tpl}
        />
        <PreviewPanel state={state} size={size} locale={locale} />
        <aside className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
            <span>opengraph-image.tsx</span>
            <Chip tone="muted" size="xs">
              edge
            </Chip>
          </header>
          <CodeBlock code={code} language="typescript" maxHeight={520} />
        </aside>
      </div>
    </OverlayPanel>
  );
}
