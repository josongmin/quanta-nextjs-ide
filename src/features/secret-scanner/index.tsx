import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  EmptyState,
  Icon,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  KIND_LABEL,
  KIND_TONE,
  MOCK_FINDINGS,
  PLAYBOOKS,
  RISK_TONE,
  entropyTone,
  scrubSnippet,
  type SecretFinding,
  type SecretKind,
} from './helpers';

const KINDS: ReadonlyArray<SecretKind> = [
  'aws',
  'stripe',
  'jwt',
  'github',
  'db_url',
  'private_key',
  'generic',
];

export function SecretScannerOverlay() {
  const open = useUiStore((s) => s.overlays.secretScanner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<SecretKind>>(
    KINDS,
  );
  const [hideMasked, setHideMasked] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_FINDINGS.filter((f) => {
      if (!activeKinds.includes(f.kind)) return false;
      if (hideMasked && f.entropy < 0.7) return false;
      if (q.length > 0) {
        const hay = `${f.file} ${f.kind} ${f.evidenceMasked}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeKinds, hideMasked, query]);

  const toggleKind = (k: SecretKind) => {
    setActiveKinds((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('secretScanner'))}
      title="Secret Scanner"
      subtitle={`${filtered.length} of ${MOCK_FINDINGS.length} findings`}
      size="lg"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Audit ticket opened')}
          >
            <Icon.Doc className="h-3 w-3" /> Open audit ticket
          </Button>
          <Button
            size="xs"
            tone="err"
            onClick={() => toast('All findings quarantined')}
          >
            <Icon.Lock className="h-3 w-3" /> Quarantine all
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="text-caps text-ink-3">Kinds</span>
        <div className="flex flex-wrap items-center gap-1">
          {KINDS.map((k) => (
            <ToggleChip
              key={k}
              active={activeKinds.includes(k)}
              onClick={() => toggleKind(k)}
            >
              {KIND_LABEL[k]}
            </ToggleChip>
          ))}
        </div>
        <span className="hairline-r mx-1 h-4" />
        <ToggleChip
          active={hideMasked}
          onClick={() => setHideMasked((v) => !v)}
        >
          Hide low-entropy
        </ToggleChip>
        <div className="ml-auto w-56">
          <SearchInput value={query} onChange={setQuery} placeholder="file or evidence" />
        </div>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_280px]">
        <div className="min-w-0 hairline-r">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No findings match"
                description="Adjust kind filters or clear the search."
              />
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <table className="w-full text-xs">
                <thead className="hairline-b bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">File</th>
                    <th className="px-2 py-1.5 text-right font-medium">Line</th>
                    <th className="px-2 py-1.5 text-left font-medium">Kind</th>
                    <th className="px-2 py-1.5 text-left font-medium">Entropy</th>
                    <th className="px-2 py-1.5 text-left font-medium">Evidence</th>
                    <th className="px-2 py-1.5 text-right font-medium">Age</th>
                    <th className="px-2 py-1.5 text-left font-medium">Risk</th>
                    <th className="px-2 py-1.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <FindingRow
                      key={f.id}
                      finding={f}
                      expanded={expanded === f.id}
                      onToggle={() =>
                        setExpanded((cur) => (cur === f.id ? null : f.id))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </div>

        {/* Right rail */}
        <aside className="bg-bg-subtle/60">
          <div className="px-3 py-2 hairline-b text-caps text-ink-3">
            Rotation playbooks
          </div>
          <ScrollArea className="max-h-[60vh]">
            <ul className="divide-y divide-line/60">
              {PLAYBOOKS.map((p) => (
                <li key={p.kind} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Chip tone={KIND_TONE[p.kind]} size="xs">
                      {KIND_LABEL[p.kind]}
                    </Chip>
                  </div>
                  <ol className="mt-1 list-decimal pl-4 text-[11px] text-ink-2">
                    {p.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <div className="mt-1 truncate rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px] text-ink-1">
                    {p.command}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>
      </div>
    </OverlayPanel>
  );
}

interface RowProps {
  finding: SecretFinding;
  expanded: boolean;
  onToggle(): void;
}

function FindingRow({ finding, expanded, onToggle }: RowProps) {
  const eTone = entropyTone(finding.entropy);
  const eBg =
    eTone === 'err'
      ? 'bg-sev-err'
      : eTone === 'warn'
        ? 'bg-sev-warn'
        : 'bg-sev-info';
  return (
    <>
      <tr
        className={cn(
          'hairline-b cursor-pointer hover:bg-bg-subtle/60',
          expanded && 'bg-bg-subtle/60',
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-1.5">
          <div className="flex items-center gap-1">
            <Icon.ChevRight
              className={cn(
                'h-3 w-3 text-ink-3 transition-transform',
                expanded && 'rotate-90',
              )}
            />
            <span className="font-mono text-ink-1">{finding.file}</span>
          </div>
        </td>
        <td className="px-2 py-1.5 text-right font-mono text-ink-3">
          {finding.line}
        </td>
        <td className="px-2 py-1.5">
          <Chip tone={KIND_TONE[finding.kind]} size="xs">
            {KIND_LABEL[finding.kind]}
          </Chip>
        </td>
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className={cn('h-full', eBg)}
                style={{ width: `${Math.round(finding.entropy * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-ink-3">
              {finding.entropy.toFixed(2)}
            </span>
          </div>
        </td>
        <td className="px-2 py-1.5">
          <Chip tone="muted" size="xs">
            <span className="font-mono">{finding.evidenceMasked}</span>
          </Chip>
        </td>
        <td className="px-2 py-1.5 text-right font-mono text-ink-3">
          {finding.age}d
        </td>
        <td className="px-2 py-1.5">
          <Chip tone={RISK_TONE[finding.riskLevel]} size="xs">
            {finding.riskLevel}
          </Chip>
        </td>
        <td className="px-2 py-1.5 text-right">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="xs"
                tone="ghost"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon.Cog className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-44 p-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-bg-hover"
                onClick={() => toast(`Rotating ${KIND_LABEL[finding.kind]}…`)}
              >
                <Icon.Refresh className="h-3 w-3" /> Rotate
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-bg-hover"
                onClick={() => toast(`Open ${finding.commit}`)}
              >
                <Icon.Branch className="h-3 w-3" /> Open commit
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-bg-hover"
                onClick={() => toast(`${finding.id} whitelisted`)}
              >
                <Icon.Shield className="h-3 w-3" /> Whitelist
              </button>
            </PopoverContent>
          </Popover>
        </td>
      </tr>
      {expanded ? (
        <tr className="hairline-b bg-bg-subtle/30">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-[1fr_220px] gap-3">
              <div className="min-w-0">
                <div className="mb-1 text-caps text-ink-3">Scrubbed snippet</div>
                <CodeBlock
                  code={scrubSnippet(finding.snippet)}
                  language="ts"
                  maxHeight={140}
                />
              </div>
              <div className="rounded-sm border border-line bg-bg p-2 text-[11px] text-ink-2">
                <div className="text-caps text-ink-3">Guidance</div>
                <p className="mt-1">
                  Rotate via the {KIND_LABEL[finding.kind]} playbook, then redact
                  the commit history with <span className="font-mono">git filter-repo</span>.
                </p>
                <div className="mt-2 text-caps text-ink-3">Commit</div>
                <div className="font-mono text-ink-1">{finding.commit}</div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
