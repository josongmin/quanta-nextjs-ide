import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  WEBHOOK_EVENTS,
  statusTone,
  uniqueEventTypes,
  type WebhookEvent,
} from './helpers';

export function WebhookTesterOverlay() {
  const open = useUiStore((s) => s.overlays.webhookTester.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [failedOnly, setFailedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(
    WEBHOOK_EVENTS[0]?.id ?? '',
  );
  const [replayPayload, setReplayPayload] = useState('{\n  "type": "ping"\n}');
  const [signingSecret, setSigningSecret] = useState('whsec_test_xxxxxxxx');

  const types = useMemo(() => uniqueEventTypes(), []);
  const filtered = useMemo(() => {
    return WEBHOOK_EVENTS.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (failedOnly && e.status !== 'failed' && e.status !== 'retried') return false;
      return true;
    });
  }, [typeFilter, failedOnly]);

  const selected: WebhookEvent | undefined =
    WEBHOOK_EVENTS.find((e) => e.id === selectedId) ?? filtered[0];

  function copyKey(key: string) {
    void navigator.clipboard?.writeText(key).catch(() => undefined);
    toast(`Copied ${key}`);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('webhookTester')}
      title="Webhook tester"
      subtitle={`${WEBHOOK_EVENTS.length} events · idempotency tracker`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Cleared event log')}>
            Clear log
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Exported HAR (mock)')}>
            Export HAR
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Subscribed endpoint (mock)')}>
            Save endpoint
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">type</span>
        <div className="flex max-w-[640px] flex-wrap items-center gap-1 overflow-hidden">
          <ToggleChip
            active={typeFilter === 'all'}
            onClick={() => setTypeFilter('all')}
          >
            all
          </ToggleChip>
          {types.slice(0, 8).map((t) => (
            <ToggleChip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto">
          <ToggleChip active={failedOnly} onClick={() => setFailedOnly((p) => !p)}>
            failed only
          </ToggleChip>
        </div>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <ScrollArea className="h-[560px]">
          <div className="p-3">
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-caps text-ink-3">
                <tr className="border-b border-line">
                  <th className="px-2 py-1 font-medium">When</th>
                  <th className="px-2 py-1 font-medium">Type</th>
                  <th className="px-2 py-1 font-medium">Status</th>
                  <th className="px-2 py-1 font-medium">Idempotency key</th>
                  <th className="px-2 py-1 font-medium text-right">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-ink-3">
                      No events matched filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      className={cn(
                        'cursor-pointer border-b border-line/60 hover:bg-bg-hover',
                        selectedId === e.id && 'bg-bg-selected',
                      )}
                      onClick={() => setSelectedId(e.id)}
                    >
                      <td className="px-2 py-1 font-mono text-[10px] text-ink-3">
                        {e.timestamp}
                      </td>
                      <td className="px-2 py-1">
                        <Chip tone="muted" size="xs">
                          {e.type}
                        </Chip>
                      </td>
                      <td className="px-2 py-1">
                        <Chip tone={statusTone(e.status)} size="xs">
                          {e.status}
                        </Chip>
                      </td>
                      <td
                        className="px-2 py-1 font-mono text-[10px] text-ink-2 hover:text-ink-1"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          copyKey(e.idempotencyKey);
                        }}
                      >
                        {e.idempotencyKey}
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-[10px] text-ink-1">
                        {e.attempts}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Replay form */}
            <div className="mt-4 rounded-sm border border-line bg-bg p-2">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Replay event
              </div>
              <div className="mt-1 space-y-1">
                <textarea
                  value={replayPayload}
                  onChange={(e) => setReplayPayload(e.target.value)}
                  rows={4}
                  className="w-full rounded-sm border border-line bg-bg-subtle p-1.5 font-mono text-[10px] text-ink-1 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={signingSecret}
                    onChange={(e) => setSigningSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="h-6 flex-1 rounded-sm border border-line bg-bg px-1.5 font-mono text-[10px] text-ink-1 focus:outline-none"
                  />
                  <Button
                    size="xs"
                    tone="accent"
                    onClick={() => {
                      try {
                        JSON.parse(replayPayload);
                        toast('Replayed payload (mock)');
                      } catch {
                        toast('Invalid JSON in payload');
                      }
                    }}
                  >
                    Replay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Right rail */}
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 p-3 text-xs">
            {selected ? (
              <>
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-ink-1">{selected.id}</span>
                    <Chip tone={statusTone(selected.status)} size="xs">
                      {selected.status}
                    </Chip>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-2">
                    {selected.type}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Chip
                      tone={selected.signatureValid ? 'static' : 'err'}
                      size="xs"
                    >
                      {selected.signatureValid ? 'sig valid' : 'sig invalid'}
                    </Chip>
                    <Chip tone="muted" size="xs">
                      {selected.attempts} attempt{selected.attempts === 1 ? '' : 's'}
                    </Chip>
                    {selected.responseCode !== undefined ? (
                      <Chip
                        tone={selected.responseCode < 400 ? 'static' : 'err'}
                        size="xs"
                      >
                        {selected.responseCode}
                      </Chip>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Payload
                  </div>
                  <div className="mt-1">
                    <CodeBlock
                      code={selected.payload}
                      language="json"
                      maxHeight={220}
                    />
                  </div>
                </div>

                <div className="rounded-sm border border-line bg-bg-subtle p-2">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Idempotency
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-ink-1">
                    {selected.idempotencyKey}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-2">
                    delivered {selected.dedupCount}× same key, dedupe ok
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    tone="default"
                    onClick={() => toast(`Retried ${selected.id} (mock)`)}
                  >
                    Retry
                  </Button>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => copyKey(selected.idempotencyKey)}
                  >
                    Copy key
                  </Button>
                </div>

                {selected.responseSnippet ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-caps text-ink-3">
                      Last response
                    </div>
                    <pre className="mt-1 rounded-sm border border-line bg-bg p-1.5 font-mono text-[10px] text-ink-1">
                      {selected.responseSnippet}
                    </pre>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Select an event row.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}
