import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useSemanticDiffStore } from '@entities/semantic-diff';
import { useDiagnosticStore } from '@entities/diagnostic';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  DEFAULT_SECTIONS,
  generatePrSummary,
  renderMiniMarkdown,
  type PrProfile,
  type PrSections,
} from './helpers';

const PROFILES: ReadonlyArray<{ value: PrProfile; label: string }> = [
  { value: 'concise', label: 'Concise' },
  { value: 'standard', label: 'Standard' },
  { value: 'verbose', label: 'Verbose' },
];

const SECTION_LABELS: Record<keyof PrSections, string> = {
  behavior: 'Behavior',
  risks: 'Risks',
  cost: 'Cost',
  tests: 'Tests',
  migration: 'Migration',
};

export function PrSummaryOverlay() {
  const open = useUiStore((s) => s.overlays.prSummary.open);
  const close = useUiStore((s) => s.closeOverlay);
  const diff = useSemanticDiffStore((s) => s.diff);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const [profile, setProfile] = useState<PrProfile>('standard');
  const [sections, setSections] = useState<PrSections>(DEFAULT_SECTIONS);
  const [draft, setDraft] = useState<string | null>(null);

  const auto = useMemo(
    () => generatePrSummary(profile, sections, diff, diagnostics),
    [profile, sections, diff, diagnostics],
  );
  const text = draft ?? auto;
  const html = useMemo(() => renderMiniMarkdown(text), [text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Markdown copied to clipboard');
    } catch {
      toast('Clipboard unavailable — preview only');
    }
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('prSummary'))}
      title="PR Summary"
      subtitle={`${diff.head} vs ${diff.base} · ${diff.entries.length} behavior changes`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => setDraft(null)}>
            Reset to auto
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Save as comment.md (preview)')}>
            <Icon.Doc className="h-3 w-3" />
            Save as comment.md
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Post to GitHub (preview)')}>
            <Icon.Branch className="h-3 w-3" />
            Post to GitHub
          </Button>
          <Button size="xs" tone="accent" onClick={handleCopy}>
            <Icon.Plus className="h-3 w-3" />
            Copy markdown
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Profile</span>
        <div className="inline-flex h-6 items-center rounded-sm border border-line bg-bg p-px">
          {PROFILES.map((p) => (
            <button
              key={p.value}
              onClick={() => setProfile(p.value)}
              aria-selected={profile === p.value}
              className={cn(
                'h-5 px-2 text-[11px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                profile === p.value && 'rounded-sm bg-bg-selected text-ink-1',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="ml-2 text-caps text-ink-3">Sections</span>
        <div className="flex gap-1">
          {(Object.keys(sections) as Array<keyof PrSections>).map((k) => (
            <button
              key={k}
              onClick={() => setSections((s) => ({ ...s, [k]: !s[k] }))}
              aria-pressed={sections[k]}
              className={cn(
                'h-5 rounded-full border px-2 text-[10px] tracking-caps',
                sections[k]
                  ? 'border-accent/30 bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-3 hover:text-ink-1',
              )}
            >
              {SECTION_LABELS[k]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-ink-3">
          {text.split('\n').length} lines · {text.length} chars
        </span>
      </div>

      <div className="grid grid-cols-2 gap-0">
        <div className="hairline-r">
          <div className="flex h-7 items-center gap-1.5 hairline-b bg-bg-subtle px-3 text-[10px] tracking-caps text-ink-3">
            <Icon.Doc className="h-3 w-3" /> Markdown source
            <Chip tone="muted" size="xs" className="ml-auto">
              editable
            </Chip>
          </div>
          <textarea
            value={text}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="block h-[420px] w-full resize-none bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-1 outline-none"
          />
        </div>
        <div>
          <div className="flex h-7 items-center gap-1.5 hairline-b bg-bg-subtle px-3 text-[10px] tracking-caps text-ink-3">
            <Icon.UpRight className="h-3 w-3" /> Live preview
          </div>
          <div
            className="h-[420px] overflow-y-auto bg-bg px-4 py-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </OverlayPanel>
  );
}
