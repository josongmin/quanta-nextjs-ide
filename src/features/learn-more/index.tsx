import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import type { RuleId } from '@shared/types';
import {
  Button,
  Chip,
  ConfidenceDot,
  Icon,
  OverlayPanel,
  Section,
  SeverityLabel,
} from '@shared/ui';
import { getRuleDoc } from './rules-docs';

export function LearnMoreOverlay() {
  const open = useUiStore((s) => s.overlays.learnMore.open);
  const close = useUiStore((s) => s.closeOverlay);
  const ruleId = useUiStore((s) => s.overlays.learnMore.ruleId) as RuleId | undefined;
  const openOverlay = useUiStore((s) => s.openOverlay);

  const doc = ruleId ? getRuleDoc(ruleId) : null;

  if (!doc) {
    return (
      <OverlayPanel
        open={open}
        onOpenChange={(o) => (o ? null : close('learnMore'))}
        title="Learn more"
        size="sm"
      >
        <div className="px-4 py-6 text-center text-xs text-ink-3">
          No rule selected.
        </div>
      </OverlayPanel>
    );
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('learnMore'))}
      title={doc.title}
      subtitle={
        <span className="flex items-center gap-2 text-xs">
          <Chip tone="muted" size="xs">
            <span className="font-mono">{doc.ruleId}</span>
          </Chip>
          <span>·</span>
          <span>{doc.category}</span>
          <span>·</span>
          <SeverityLabel severity={doc.severityBaseline} />
          <span>·</span>
          <span className="inline-flex items-center gap-1 text-ink-3">
            <ConfidenceDot confidence={doc.confidenceBaseline} />
            {doc.confidenceBaseline}
          </span>
        </span>
      }
      size="sm"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast(`Mute ${doc.ruleId} project-wide (preview)`)}
          >
            Mute project-wide
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => {
              close('learnMore');
              openOverlay('settings', { tab: 'rules' });
            }}
          >
            <Icon.Settings className="h-3 w-3" />
            Tune severity
          </Button>
        </>
      }
    >
      <Section title="What it does" defaultOpen>
        <p className="text-xs leading-relaxed text-ink-2">{doc.what}</p>
      </Section>

      <Section title="Why it matters" defaultOpen>
        <ul className="ml-3 list-disc space-y-1 text-xs text-ink-2">
          {doc.why.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </Section>

      <Section title="Examples" defaultOpen>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <div className="mb-1 inline-flex items-center gap-1 text-[10px] tracking-caps text-sev-err">
              <Icon.X className="h-3 w-3" />
              Bad
            </div>
            <pre className="overflow-x-auto rounded-sm border border-line bg-sev-err-soft/30 p-2 font-mono text-[11px] leading-relaxed text-ink-1">
              <code>{doc.examples.bad}</code>
            </pre>
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-1 text-[10px] tracking-caps text-sem-static">
              <Icon.Plus className="h-3 w-3" />
              Good
            </div>
            <pre className="overflow-x-auto rounded-sm border border-line bg-sem-static-soft/30 p-2 font-mono text-[11px] leading-relaxed text-ink-1">
              <code>{doc.examples.good}</code>
            </pre>
          </div>
        </div>
      </Section>

      <Section title="Suppression" defaultOpen={false}>
        <p className="text-xs text-ink-2">{doc.suppression}</p>
      </Section>

      {doc.relatedRuleIds.length > 0 && (
        <Section title="Related rules" defaultOpen={false}>
          <div className="flex flex-wrap gap-1">
            {doc.relatedRuleIds.map((rid) => (
              <button
                key={rid}
                onClick={() => openOverlay('learnMore', { ruleId: rid })}
                className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[10px] text-ink-2 hover:bg-bg-hover hover:text-ink-1"
              >
                {rid}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Reference" defaultOpen={false}>
        <a
          href={doc.reference}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          {doc.reference}
          <Icon.UpRight className="h-3 w-3" />
        </a>
      </Section>
    </OverlayPanel>
  );
}
