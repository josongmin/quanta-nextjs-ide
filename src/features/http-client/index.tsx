import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  ENVS,
  INITIAL_HISTORY,
  METHODS,
  SAVED_REQUESTS,
  relativeTimeMs,
  type HistoryEntry,
  type HttpEnv,
  type HttpHeader,
  type HttpMethod,
  type SavedRequest,
} from './helpers';
import { EnvToolbar } from './parts/env-toolbar';
import { SavedList } from './parts/saved-list';
import { UrlInput } from './parts/url-input';
import { HeadersEditor } from './parts/headers-editor';
import { ResponsePanel } from './parts/response-panel';
import { HistoryPanel } from './parts/history-panel';
import { EnvVarsPanel } from './parts/env-vars-panel';

export function HttpClientOverlay() {
  const open = useUiStore((s) => s.overlays.httpClient.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [envId, setEnvId] = useState<HttpEnv['id']>('dev');
  const [reqId, setReqId] = useState<string>(SAVED_REQUESTS[0]!.id);
  const [history, setHistory] = useState<ReadonlyArray<HistoryEntry>>(INITIAL_HISTORY);
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'raw'>('body');

  const initialReq = SAVED_REQUESTS[0]!;
  const [method, setMethod] = useState<HttpMethod>(initialReq.method);
  const [url, setUrl] = useState<string>(initialReq.url);
  const [headers, setHeaders] = useState<ReadonlyArray<HttpHeader>>(initialReq.headers);
  const [body, setBody] = useState<string>(initialReq.body);

  const env = ENVS.find((e) => e.id === envId)!;
  const [vars, setVars] = useState<Record<string, string>>(env.vars);

  const lastResponse = history[0];

  function loadRequest(id: string): void {
    const r = SAVED_REQUESTS.find((s) => s.id === id);
    if (!r) return;
    setReqId(id);
    setMethod(r.method);
    setUrl(r.url);
    setHeaders(r.headers);
    setBody(r.body);
  }

  function changeEnv(id: HttpEnv['id']): void {
    setEnvId(id);
    const e = ENVS.find((x) => x.id === id);
    if (e) setVars(e.vars);
  }

  function send(): void {
    const next: HistoryEntry = {
      id: `h_${Date.now()}`,
      reqId,
      method,
      url,
      status: 200,
      ms: 60 + Math.round(Math.random() * 200),
      size: '512b',
      body: '{"ok":true,"echo":"mock"}',
      ts: Date.now(),
    };
    setHistory((h) => [next, ...h].slice(0, 24));
    toast(`${method} ${url} → 200 (mock)`);
  }

  function loadFromHistory(h: HistoryEntry): void {
    setMethod(h.method);
    toast(`Loaded history entry ${h.method} ${h.url}`);
  }

  function setHeader(idx: number, patch: Partial<HttpHeader>): void {
    setHeaders((arr) => arr.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }
  function addHeader(): void {
    setHeaders((arr) => [...arr, { key: '', value: '' }]);
  }
  function removeHeader(idx: number): void {
    setHeaders((arr) => arr.filter((_, i) => i !== idx));
  }

  function setVar(k: string, v: string): void {
    setVars((m) => ({ ...m, [k]: v }));
  }
  function removeVar(k: string): void {
    setVars((m) => {
      const { [k]: _ignored, ...rest } = m;
      void _ignored;
      return rest;
    });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('httpClient')}
      title="HTTP Client"
      subtitle=".http file scratch · env vars · history"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="text-ink-3">
            env: <span className="font-mono text-ink-1">{env.name}</span> · saved
            requests:{' '}
            <span className="font-mono text-ink-1">{SAVED_REQUESTS.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => toast('Saved request (mock)')}>
              Save request
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('cURL copied to clipboard (mock)')}
            >
              Generate cURL
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Exported to scratches/api.http (mock)')}
            >
              Export to .http file
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('httpClient')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <EnvToolbar envId={envId} onChange={changeEnv} />

      <div className="grid" style={{ gridTemplateColumns: '240px 1fr 260px' }}>
        <SavedList reqId={reqId} onSelect={loadRequest} />

        <section className="flex flex-col">
          <div className="hairline-b p-3">
            <div className="flex items-center gap-1.5">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="h-6 rounded-sm border border-line bg-bg px-1.5 text-xs font-medium text-ink-1 focus:outline-none"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <UrlInput url={url} onChange={setUrl} />
              <Button size="sm" tone="accent" onClick={send}>
                Send
              </Button>
            </div>

            <HeadersEditor
              headers={headers}
              onSet={setHeader}
              onAdd={addHeader}
              onRemove={removeHeader}
            />

            <div className="mt-3">
              <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                body
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                spellCheck={false}
                className="block w-full resize-none rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] leading-[16px] text-ink-1 focus:border-accent focus:outline-none"
                placeholder="// no body"
              />
            </div>
          </div>

          <ResponsePanel
            lastResponse={lastResponse}
            responseTab={responseTab}
            onChangeTab={setResponseTab}
          />
        </section>

        <aside className="hairline-l">
          <HistoryPanel history={history} onLoad={loadFromHistory} />
          <EnvVarsPanel
            envName={env.name}
            vars={vars}
            onSetVar={setVar}
            onRemoveVar={removeVar}
          />
          <div className="hairline-t px-2 py-1.5 text-[10px] text-ink-3">
            last run: {lastResponse ? relativeTimeMs(lastResponse.ts) : 'never'}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

// hint to satisfy unused-import linting in environments where SavedRequest type is not referenced
export type { SavedRequest };
