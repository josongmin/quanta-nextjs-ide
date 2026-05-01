import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import {
  SAMPLE_NS,
  categorize,
  localeData,
  messages,
  missingCategories,
  render,
  type LocaleId,
  type PluralCategory,
} from './helpers';

export function PluralRulesTesterOverlay() {
  const open = useUiStore((s) => s.overlays.pluralRulesTester.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [localeId, setLocaleId] = useState<LocaleId>('ru');
  const [messageId, setMessageId] = useState<string>('cart-items');

  const locale = useMemo(
    () => localeData.find((l) => l.id === localeId) ?? localeData[0]!,
    [localeId],
  );
  const message = useMemo(
    () => messages.find((m) => m.id === messageId) ?? messages[0]!,
    [messageId],
  );
  const missing = useMemo(
    () => missingCategories(locale, message),
    [locale, message],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('pluralRulesTester'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Hash className="h-4 w-4 text-ink-3" />
          <span>Plural Rules Tester</span>
        </span>
      }
      subtitle="CLDR categories · ICU MessageFormat"
      size="xl"
      footer={
        <Button
          size="sm"
          tone="ghost"
          onClick={() => close('pluralRulesTester')}
        >
          Close
        </Button>
      }
    >
      <div className="px-3 py-2 hairline-b">
        <div className="flex flex-wrap items-center gap-2">
          <SelectControl<LocaleId>
            label="locale"
            value={localeId}
            onChange={(v) => setLocaleId(v)}
            options={localeData.map((l) => ({ value: l.id, label: l.label }))}
          />
          <SelectControl<string>
            label="message"
            value={messageId}
            onChange={(v) => setMessageId(v)}
            options={messages.map((m) => ({ value: m.id, label: m.label }))}
          />
          <span className="ml-2 flex items-center gap-1">
            <span className="text-caps text-ink-3">categories</span>
            {locale.categories.map((c) => (
              <Chip key={c} tone="muted" size="xs">
                {c}
              </Chip>
            ))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            <section>
              <h3 className="mb-1 text-caps text-ink-3">ICU MessageFormat</h3>
              <CodeBlock
                code={highlightedIcu(message.icu)}
                language="icu"
                showLineNumbers={false}
                maxHeight={120}
              />
              <div className="mt-2 text-[11px] text-ink-3">
                Each form is rendered after CLDR plural lookup for the active
                locale.
              </div>
            </section>
            <section>
              <h3 className="mb-1 text-caps text-ink-3">Resolved output</h3>
              <table className="w-full border-separate border-spacing-0 text-xs">
                <thead>
                  <tr className="text-caps text-ink-3">
                    <th className="hairline-b px-2 py-1 text-left font-normal">n</th>
                    <th className="hairline-b px-2 py-1 text-left font-normal">category</th>
                    <th className="hairline-b px-2 py-1 text-left font-normal">rendered</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_NS.map((n) => {
                    const cat = categorize(locale.id, n);
                    const form =
                      message.forms[cat] ?? message.forms.other;
                    return (
                      <tr key={n}>
                        <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-1">
                          {n}
                        </td>
                        <td className="hairline-b px-2 py-1">
                          <Chip
                            tone={
                              missing.includes(cat) ? 'err' : categoryTone(cat)
                            }
                            size="xs"
                          >
                            {cat}
                          </Chip>
                        </td>
                        <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-1">
                          {render(form, n)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>

          <div className="mt-3">
            <h3 className="mb-1 text-caps text-ink-3">Missing categories</h3>
            {missing.length === 0 ? (
              <div className="text-[11px] text-ink-3">
                All required forms for{' '}
                <span className="font-mono">{locale.id}</span> are declared.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {missing.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      toast(`Add '${c}' form for ${locale.id}`, {
                        description: `Required by CLDR for ${locale.id}.`,
                      })
                    }
                    className="inline-flex h-5 items-center rounded-full border border-transparent bg-sev-warn-soft px-1.5 text-[11px] tracking-caps text-sev-warn hover:brightness-95"
                  >
                    {locale.id} needs `{c}`
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <h3 className="mb-1 text-caps text-ink-3">Rule tree · {locale.id}</h3>
          <CodeBlock
            code={locale.formula}
            language="rules"
            showLineNumbers={false}
            maxHeight={220}
          />
          <div className="mt-3 hairline-t pt-2">
            <h3 className="mb-1 text-caps text-ink-3">Reference</h3>
            <ul className="space-y-1 text-[11px] text-ink-2">
              <li>
                <span className="text-ink-3">i</span> = integer digits
              </li>
              <li>
                <span className="text-ink-3">v</span> = visible fraction digits
              </li>
              <li>
                <span className="text-ink-3">f</span> = fraction value
              </li>
              <li>
                <span className="text-ink-3">n</span> = numeric value
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function categoryTone(c: PluralCategory): 'static' | 'info' | 'accent' | 'muted' {
  if (c === 'one') return 'accent';
  if (c === 'other') return 'muted';
  if (c === 'zero') return 'static';
  return 'info';
}

function highlightedIcu(icu: string): string {
  // CodeBlock renders plain text; format with line breaks for readability.
  // Split at top-level braces for visual scanning.
  return icu.replace(/\{/g, '{').replace(/, plural,/g, ', plural,\n  ');
}
