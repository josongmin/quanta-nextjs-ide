import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, EmptyState, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  apiEndpoints,
  endpointLabel,
  type ApiEndpointDef,
  type ApiProtocol,
  type ApiResponseSnapshot,
} from './helpers';
import { statusTone } from './parts/helpers';
import { EndpointList } from './parts/endpoint-list';
import { RequestForm } from './parts/request-form';
import { ResponsePanel } from './parts/response-panel';

export function ApiPlaygroundOverlay() {
  const open = useUiStore((s) => s.overlays.apiPlayground.open);
  const requested = useUiStore((s) => s.overlays.apiPlayground.endpointId);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(apiEndpoints[0]?.id ?? '');
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<Array<{ k: string; v: string }>>([
    { k: 'Accept', v: 'application/json' },
  ]);
  const [authOn, setAuthOn] = useState(false);
  const [responses, setResponses] = useState<Record<string, ApiResponseSnapshot[]>>({});
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (requested && apiEndpoints.some((e) => e.id === requested)) {
      setSelectedId(requested);
    }
  }, [open, requested]);

  const selected = useMemo(
    () => apiEndpoints.find((e) => e.id === selectedId) ?? null,
    [selectedId],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apiEndpoints.filter(
      (e) => !q || endpointLabel(e).toLowerCase().includes(q) || e.group.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const out: Record<ApiProtocol, ApiEndpointDef[]> = { REST: [], GraphQL: [], tRPC: [] };
    for (const e of visible) out[e.protocol].push(e);
    return out;
  }, [visible]);

  // Reset paramValues when endpoint changes
  useEffect(() => {
    if (!selected) return;
    const next: Record<string, string> = {};
    for (const p of selected.params) {
      if (p.default !== undefined) next[p.name] = String(p.default);
      else next[p.name] = '';
    }
    setParamValues(next);
    setActiveResponseId(null);
  }, [selectedId, selected]);

  const allResponses: ApiResponseSnapshot[] = selected
    ? [...(responses[selected.id] ?? []), ...selected.recentResponses]
    : [];
  const activeResponse =
    allResponses.find((r) => r.id === activeResponseId) ?? allResponses[0] ?? null;

  const onSend = () => {
    if (!selected) return;
    const newResp: ApiResponseSnapshot = {
      id: `mock-${Date.now()}`,
      status: 200,
      ms: 60 + Math.floor(Math.random() * 100),
      at: new Date().toISOString(),
      body: JSON.stringify({ ok: true, mock: true, endpoint: selected.id, params: paramValues }, null, 2),
    };
    setResponses((m) => ({
      ...m,
      [selected.id]: [newResp, ...(m[selected.id] ?? [])].slice(0, 5),
    }));
    setActiveResponseId(newResp.id);
    toast('Sent (mock)');
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('apiPlayground')}
      title="API Playground"
      subtitle="REST · GraphQL · tRPC"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Saved as snapshot (mock)')}>
            Save as snapshot
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Test generated (mock)')}>
            Generate test
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[240px_1fr]">
        <EndpointList
          search={search}
          onSearchChange={setSearch}
          grouped={grouped}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {!selected ? (
          <div className="p-4">
            <EmptyState title="No endpoint" description="Select an endpoint from the list" />
          </div>
        ) : (
          <div className="grid grid-rows-[auto_1fr]">
            <RequestForm
              selected={selected}
              paramValues={paramValues}
              headers={headers}
              authOn={authOn}
              onParamChange={(name, value) =>
                setParamValues((m) => ({ ...m, [name]: value }))
              }
              onParamToggle={(name) =>
                setParamValues((m) => ({
                  ...m,
                  [name]: m[name] === 'true' ? 'false' : 'true',
                }))
              }
              onAddHeader={() => setHeaders((h) => [...h, { k: '', v: '' }])}
              onUpdateHeader={(i, key, value) =>
                setHeaders((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, [key]: value } : x)),
                )
              }
              onRemoveHeader={(i) =>
                setHeaders((arr) => arr.filter((_, j) => j !== i))
              }
              onToggleAuth={() => setAuthOn((v) => !v)}
              onSend={onSend}
            />

            <div className="bg-bg-subtle/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-caps text-ink-3">history</span>
                <div className="flex flex-wrap gap-1">
                  {allResponses.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveResponseId(r.id)}
                      className={cn(
                        'rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] hover:bg-bg-hover',
                        r.id === (activeResponse?.id ?? null) && 'ring-1 ring-accent',
                      )}
                    >
                      <span
                        className={cn(
                          'mr-1 font-mono',
                          statusTone(r.status) === 'err'
                            ? 'text-sev-err'
                            : statusTone(r.status) === 'warn'
                              ? 'text-sev-warn'
                              : 'text-ink-1',
                        )}
                      >
                        {r.status}
                      </span>
                      <span className="text-ink-3">{r.ms}ms</span>
                    </button>
                  ))}
                </div>
              </div>
              {activeResponse ? (
                <ResponsePanel
                  endpoint={selected}
                  response={activeResponse}
                  headers={headers}
                  authOn={authOn}
                  paramValues={paramValues}
                />
              ) : (
                <EmptyState title="No response yet" description="Click Send to make a mock request" />
              )}
            </div>
          </div>
        )}
      </div>
    </OverlayPanel>
  );
}
