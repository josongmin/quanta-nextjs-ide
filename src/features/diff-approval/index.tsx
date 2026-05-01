import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  PATCHES,
  riskTone,
  severityLabel,
  type Patch,
} from './helpers';

type TabKey = 'diff' | 'risk' | 'proof';

export function DiffApprovalOverlay() {
  const open = useUiStore((s) => s.overlays.diffApproval.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selectedId, setSelectedId] = useState<string>(PATCHES[0]?.id ?? '');
  const [tab, setTab] = useState<TabKey>('diff');
  const [verifiedById, setVerifiedById] = useState<
    Record<string, ReadonlyArray<string>>
  >({});

  const selected = useMemo<Patch | null>(
    () => PATCHES.find((p) => p.id === selectedId) ?? PATCHES[0] ?? null,
    [selectedId],
  );

  const verified = selected ? (verifiedById[selected.id] ?? []) : [];
  const verifiedCount = verified.length;
  const totalProofs = selected ? selected.proofObligations.length : 0;
  const allVerified = totalProofs > 0 && verifiedCount === totalProofs;

  function toggleProof(po: string) {
    if (!selected) return;
    setVerifiedById((prev) => {
      const cur = prev[selected.id] ?? [];
      const next = cur.includes(po) ? cur.filter((x) => x !== po) : [...cur, po];
      return { ...prev, [selected.id]: next };
    });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('diffApproval'))}
      title="Diff Approval"
      subtitle={`AI patch queue · ${PATCHES.length} pending`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <Chip
            tone={allVerified ? 'info' : 'warn'}
            size="xs"
            className="font-mono"
          >
            {verifiedCount} of {totalProofs} proofs verified
          </Chip>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              disabled={!allVerified}
              onClick={() =>
                toast.success(`Approved ${selected?.id ?? ''} (mock)`)
              }
            >
              Approve
            </Button>
            <Button
              size="xs"
              tone="warn"
              onClick={() => toast(`Requested changes on ${selected?.id ?? ''}`)}
            >
              Request changes
            </Button>
            <Button
              size="xs"
              tone="err"
              onClick={() => toast(`Blocked ${selected?.id ?? ''}`)}
            >
              Block
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast(`Deferred ${selected?.id ?? ''}`)}
            >
              Defer
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[300px_1fr] divide-x divide-line">
        {/* Queue */}
        <div className="max-h-[64vh] overflow-y-auto">
          <ul className="divide-y divide-line">
            {PATCHES.map((p) => {
              const isSel = p.id === selected?.id;
              return (
                <li
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-xs hover:bg-bg-hover',
                    isSel && 'bg-accent-soft/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Chip tone={riskTone(p.riskScore)} size="xs">
                      risk {p.riskScore}
                    </Chip>
                    <span className="ml-auto font-mono text-[10px] text-ink-3">
                      {p.id}
                    </span>
                  </div>
                  <div className="mt-1 text-ink-1">{p.summary}</div>
                  <div className="mt-1 text-[10px] text-ink-3">
                    {p.changedFiles.length} files · {p.proofObligations.length}{' '}
                    proofs
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Main */}
        <div className="min-w-0">
          {selected ? (
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as TabKey)}
              className="flex h-full flex-col"
            >
              <TabsList>
                <TabsTrigger value="diff">Diff</TabsTrigger>
                <TabsTrigger value="risk">
                  Risk
                  <Chip tone={riskTone(selected.riskScore)} size="xs" className="ml-1">
                    {selected.riskScore}
                  </Chip>
                </TabsTrigger>
                <TabsTrigger value="proof">
                  Proof
                  <Chip tone="muted" size="xs" className="ml-1">
                    {verifiedCount}/{totalProofs}
                  </Chip>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="diff" className="max-h-[58vh] overflow-y-auto px-3 py-2">
                {selected.files.map((f) => (
                  <div key={f.path} className="mb-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-1">
                        {f.path}
                      </span>
                      <span className="text-[10px] text-ink-3">
                        {f.hunks.length} hunk{f.hunks.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    {f.hunks.map((h, i) => (
                      <div key={i} className="mb-2">
                        <div className="mb-0.5 font-mono text-[10px] text-ink-3">
                          {h.header}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <CodeBlock
                            code={h.before}
                            diff="before"
                            showLineNumbers={false}
                            maxHeight={180}
                          />
                          <CodeBlock
                            code={h.after}
                            diff="after"
                            showLineNumbers={false}
                            maxHeight={180}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="risk" className="max-h-[58vh] overflow-y-auto px-3 py-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-caps text-ink-3">
                    overall risk
                  </span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-subtle">
                    <div
                      className={cn(
                        'h-full',
                        selected.riskScore >= 60
                          ? 'bg-sev-err'
                          : selected.riskScore >= 30
                            ? 'bg-sev-warn'
                            : 'bg-sev-info',
                      )}
                      style={{ width: `${selected.riskScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-ink-1">
                    {selected.riskScore}
                  </span>
                </div>
                <ul className="divide-y divide-line rounded-sm border border-line">
                  {selected.riskFactors.map((rf, i) => (
                    <li key={i} className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Chip tone={rf.severity} size="xs">
                          {severityLabel(rf.severity)}
                        </Chip>
                        <span className="font-medium text-ink-1">
                          {rf.label}
                        </span>
                      </div>
                      <p className="mt-1 text-ink-2">{rf.explanation}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <span className="text-[10px] uppercase tracking-caps text-ink-3">
                    recommended reviewers
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selected.reviewers.map((r) => (
                      <Chip key={r} tone="muted" size="xs">
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="proof" className="max-h-[58vh] overflow-y-auto px-3 py-2">
                <ul className="divide-y divide-line rounded-sm border border-line">
                  {selected.proofObligations.map((po) => {
                    const checked = verified.includes(po.id);
                    return (
                      <li key={po.id}>
                        <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-bg-hover">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProof(po.id)}
                          />
                          <span
                            className={cn(
                              'flex-1',
                              checked ? 'text-ink-3 line-through' : 'text-ink-1',
                            )}
                          >
                            {po.text}
                          </span>
                          {checked && (
                            <Chip tone="info" size="xs">
                              verified
                            </Chip>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {!allVerified && (
                  <p className="mt-2 text-[11px] text-ink-3">
                    All proofs must be verified to enable Approve.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="px-4 py-6 text-xs text-ink-3">
              Select a patch to review.
            </div>
          )}
        </div>
      </div>
    </OverlayPanel>
  );
}
