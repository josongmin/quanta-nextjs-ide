import { useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  Icon,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
  violations,
  type ColorToken,
  type PaletteTab,
} from './helpers';

const COLOR_GROUPS: ColorToken['group'][] = [
  'surface',
  'border',
  'text',
  'accent',
  'severity',
  'semantic',
];

const GROUP_LABEL: Record<ColorToken['group'], string> = {
  surface: 'Surface',
  border: 'Border',
  text: 'Text',
  accent: 'Accent',
  severity: 'Severity',
  semantic: 'Semantic',
};

export function TailwindPaletteOverlay() {
  const open = useUiStore((s) => s.overlays.tailwindPalette.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [tab, setTab] = useState<PaletteTab>('color');

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('tailwindPalette'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Hex className="h-4 w-4 text-ink-3" />
          <span>Tailwind Palette</span>
        </span>
      }
      subtitle="color · spacing · radius · shadow tokens used in this project"
      size="sm"
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as PaletteTab)}>
        <TabsList>
          <TabsTrigger value="color">Color</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="radius">Radius</TabsTrigger>
          <TabsTrigger value="shadow">Shadow</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
        </TabsList>

        <TabsContent value="color">
          <ColorTab />
          <ViolationFooter
            label={`${violations.rawColors} raw colors found`}
            kind="colors"
          />
        </TabsContent>

        <TabsContent value="spacing">
          <SpacingTab />
          <ViolationFooter
            label={`${violations.rawSpacing} raw spacing values found`}
            kind="spacing values"
          />
        </TabsContent>

        <TabsContent value="radius">
          <RadiusTab />
          <ViolationFooter
            label={`${violations.rawRadius} raw radius values found`}
            kind="radius values"
          />
        </TabsContent>

        <TabsContent value="shadow">
          <ShadowTab />
          <ViolationFooter
            label={`${violations.rawShadow} raw shadow values found`}
            kind="shadow values"
          />
        </TabsContent>

        <TabsContent value="typography">
          <TypographyTab />
          <ViolationFooter
            label={`${violations.rawTypography} raw font sizes found`}
            kind="font sizes"
          />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}

function ColorTab() {
  return (
    <div className="px-4 py-3">
      {COLOR_GROUPS.map((group) => {
        const items = colorTokens.filter((t) => t.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-4 last:mb-0">
            <h3 className="mb-1.5 text-caps text-ink-3">{GROUP_LABEL[group]}</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((t) => (
                <ColorSwatch key={t.name} token={t} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ColorSwatch({ token }: { token: ColorToken }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-line p-1.5">
      <span
        aria-hidden
        className="inline-block h-8 w-8 shrink-0 rounded-sm border border-line"
        style={{ backgroundColor: `hsl(var(--${token.cssVar}))` }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[11px] text-ink-1">
          {token.name}
        </div>
        <div className="text-[10px] text-ink-3">{token.usages} uses</div>
      </div>
      <button
        onClick={() =>
          toast(`Find usages: ${token.name}`, {
            description: `${token.usages} occurrences across project`,
          })
        }
        className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-accent"
        aria-label="Find usages"
      >
        <Icon.Search className="h-3 w-3" />
      </button>
    </div>
  );
}

function SpacingTab() {
  return (
    <div className="px-4 py-3">
      <table className="w-full text-sm">
        <thead className="bg-bg-subtle text-caps text-ink-3">
          <tr>
            <th className="w-16 px-3 py-1.5 text-left font-normal">token</th>
            <th className="w-20 px-3 py-1.5 text-left font-normal">px</th>
            <th className="px-3 py-1.5 text-left font-normal">visual</th>
            <th className="w-24 px-3 py-1.5 text-right font-normal">uses</th>
          </tr>
        </thead>
        <tbody>
          {spacingTokens.map((t, idx) => (
            <tr
              key={t.name}
              className={cn(idx !== spacingTokens.length - 1 && 'border-b border-line')}
            >
              <td className="px-3 py-1.5 font-mono text-[12px] text-ink-1">
                {t.name}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] text-ink-3">
                {t.px}px
              </td>
              <td className="px-3 py-1.5">
                <span
                  aria-hidden
                  className="inline-block h-3 rounded-sm bg-accent-soft border border-accent/30"
                  style={{ width: `${t.px}px` }}
                />
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-[11px] text-ink-3">
                {t.usages}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RadiusTab() {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        {radiusTokens.map((t) => (
          <div key={t.name} className="flex flex-col items-center gap-1">
            <div
              aria-hidden
              className="h-12 w-12 border border-line bg-bg-subtle"
              style={{ borderRadius: `${t.px}px` }}
            />
            <div className="font-mono text-[11px] text-ink-1">{t.name}</div>
            <div className="text-[10px] text-ink-3">
              {t.px}px · {t.usages} uses
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowTab() {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-end gap-4">
        {shadowTokens.map((t) => (
          <div key={t.name} className="flex flex-col items-center gap-1.5">
            <div
              aria-hidden
              className={cn('h-16 w-28 rounded-sm bg-bg border border-line', t.className)}
            />
            <div className="font-mono text-[11px] text-ink-1">{t.className}</div>
            <div className="text-[10px] text-ink-3">{t.usages} uses</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-3">
        Project rule: shadows are reserved for floating popovers and focus rings.
        Avoid them on inline cards and surfaces.
      </p>
    </div>
  );
}

function TypographyTab() {
  return (
    <div className="px-4 py-3">
      <ul className="space-y-2">
        {typographyTokens.map((t, idx) => (
          <li
            key={t.name}
            className={cn(
              'flex items-baseline gap-3 pb-2',
              idx !== typographyTokens.length - 1 && 'hairline-b',
            )}
          >
            <span className="w-12 shrink-0 font-mono text-[11px] text-ink-3">
              {t.name}
            </span>
            <span className="w-20 shrink-0 font-mono text-[10px] text-ink-3">
              {t.px}/{t.lineHeightPx}px
            </span>
            <span
              className="flex-1 truncate text-ink-1"
              style={{ fontSize: `${t.px}px`, lineHeight: `${t.lineHeightPx}px` }}
            >
              {t.sample}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-ink-3">
              {t.usages} uses
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViolationFooter({
  label,
  kind,
}: {
  label: string;
  kind: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 hairline-t bg-bg-subtle">
      <div className="flex items-center gap-2">
        <Chip tone="warn" size="xs" className="font-normal normal-case">
          {match(true)
            .when(() => /^0\b/.test(label), () => 'all clean')
            .otherwise(() => 'design-token violations')}
        </Chip>
        <span className="text-[11px] text-ink-3">{label}</span>
      </div>
      <Button
        size="xs"
        tone="ghost"
        onClick={() =>
          toast(`Convert raw ${kind} to tokens`, {
            description: 'Mock — would emit codemod patches',
          })
        }
      >
        <Icon.Bulb className="h-3 w-3" /> Convert
      </Button>
    </div>
  );
}
