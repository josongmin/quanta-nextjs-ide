import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  REGIONS,
  STYLES,
  TRACKERS,
  configToJson,
  defaultConfig,
  type BannerConfig,
  type Category,
} from './helpers';
import { BannerPreview } from './parts/banner-preview';
import { BannerCopyForm } from './parts/banner-copy-form';
import { CategoryDescriptions } from './parts/category-descriptions';
import { TrackersGrid } from './parts/trackers-grid';
import { CmpSidebar } from './parts/cmp-sidebar';

export function CookieConsentBuilderOverlay() {
  const open = useUiStore((s) => s.overlays.cookieConsentBuilder.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [config, setConfig] = useState<BannerConfig>(() => defaultConfig());

  const update = (patch: Partial<BannerConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const toggleTracker = (id: string) =>
    setConfig((c) => ({
      ...c,
      enabledTrackers: c.enabledTrackers.includes(id)
        ? c.enabledTrackers.filter((x) => x !== id)
        : [...c.enabledTrackers, id],
    }));

  const updateDesc = (cat: Category, v: string) =>
    setConfig((c) => ({
      ...c,
      perCategoryDescriptions: { ...c.perCategoryDescriptions, [cat]: v },
    }));

  const json = useMemo(() => configToJson(config), [config]);

  const trackersByCat = useMemo(() => {
    const grouped: Record<Category, ReadonlyArray<typeof TRACKERS[number]>> = {
      'strictly-necessary': [],
      functional: [],
      analytics: [],
      marketing: [],
    };
    for (const t of TRACKERS) {
      grouped[t.category] = [...grouped[t.category], t];
    }
    return grouped;
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('cookieConsentBuilder')}
      title="Cookie Consent Builder"
      subtitle={`${TRACKERS.length} trackers · ${config.style} · ${config.region}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-end gap-1.5 text-xs">
          <Button size="xs" tone="default" onClick={() => toast('Banner published (mock)')}>
            Publish banner
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Snippet copied (mock)')}>
            Copy snippet
          </Button>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">style:</span>
            {STYLES.map((s) => (
              <ToggleChip
                key={s}
                active={config.style === s}
                onClick={() => update({ style: s })}
              >
                {s}
              </ToggleChip>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <span className="text-ink-3">region:</span>
            {REGIONS.map((r) => (
              <ToggleChip
                key={r}
                active={config.region === r}
                onClick={() => update({ region: r })}
              >
                {r}
              </ToggleChip>
            ))}
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <BannerCopyForm config={config} onUpdate={update} />

                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="text-caps text-ink-3">Live preview</div>
                  <div className="mt-2">
                    <BannerPreview style={config.style} region={config.region} />
                  </div>
                  <div className="mt-2 text-[10px] text-ink-3">
                    rendered as 360×200 mock · text shown is placeholder
                  </div>
                </div>
              </div>

              <CategoryDescriptions config={config} onUpdateDesc={updateDesc} />

              <TrackersGrid
                config={config}
                trackersByCat={trackersByCat}
                onToggleTracker={toggleTracker}
              />
            </div>
          </ScrollArea>
        </div>

        <CmpSidebar json={json} />
      </div>
    </OverlayPanel>
  );
}
