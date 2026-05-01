import { useMemo } from 'react';
import { Chip, Icon, ScrollArea } from '@shared/ui';
import { useApiContractLinkStore } from './store';
import { ContractCard } from './contract-card';
import { ExtCard } from './ext-card';

export function ApiContractLinkPanel() {
  const contracts = useApiContractLinkStore((s) => s.contracts);
  const changes = useApiContractLinkStore((s) => s.changes);
  const externalRisks = useApiContractLinkStore((s) => s.externalRisks);
  const expandedId = useApiContractLinkStore((s) => s.expandedId);
  const setExpanded = useApiContractLinkStore((s) => s.setExpanded);

  const driftByEndpoint = useMemo(() => {
    const m = new Map<string, typeof changes>();
    for (const c of changes) {
      const arr = m.get(c.endpoint) ?? [];
      arr.push(c);
      m.set(c.endpoint, arr);
    }
    return m;
  }, [changes]);

  const stats = useMemo(() => {
    const matched = contracts.filter((c) => c.status === 'matched').length;
    const orphanCallers = contracts.filter((c) => c.status === 'orphan-caller').length;
    const orphanHandlers = contracts.filter((c) => c.status === 'orphan-handler').length;
    const breaking = changes.filter((c) => c.breaking).length;
    return { matched, orphanCallers, orphanHandlers, breaking };
  }, [contracts, changes]);

  return (
    <div className="grid h-full grid-cols-[1fr_360px] overflow-hidden">
      <div className="flex flex-col">
        <header className="flex items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
          <Icon.Link className="h-3 w-3 text-accent" />
          <span className="font-medium text-ink-1">API Contracts</span>
          <Chip tone="info" size="xs">
            {stats.matched} matched
          </Chip>
          <Chip tone="warn" size="xs">
            {stats.orphanCallers} orphan callers
          </Chip>
          <Chip tone="muted" size="xs">
            {stats.orphanHandlers} orphan handlers
          </Chip>
          {stats.breaking > 0 ? (
            <Chip tone="err" size="xs">
              {stats.breaking} breaking drift
            </Chip>
          ) : null}
        </header>
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="flex flex-col gap-1.5">
            {contracts.length === 0 ? (
              <div className="rounded-sm bg-bg-subtle/40 p-6 text-center text-xs text-ink-3">
                No contracts detected.
              </div>
            ) : (
              contracts.map((c) => (
                <ContractCard
                  key={c.id}
                  contract={c}
                  drift={driftByEndpoint.get(c.endpoint) ?? []}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpanded(expandedId === c.id ? null : c.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="hairline-l flex flex-col bg-bg-subtle/30">
        <header className="flex h-9 items-center gap-2 hairline-b px-3 text-xs">
          <Icon.Shield className="h-3 w-3 text-accent" />
          <span className="font-medium text-ink-1">External Services</span>
          <span className="ml-auto font-mono text-[10px] text-ink-3">
            {externalRisks.length}
          </span>
        </header>
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="flex flex-col gap-2">
            {externalRisks.length === 0 ? (
              <div className="rounded-sm bg-bg/60 p-4 text-center text-xs text-ink-3">
                No third-party SDK calls detected.
              </div>
            ) : (
              externalRisks.map((r) => <ExtCard key={r.provider} risk={r} />)
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default ApiContractLinkPanel;
