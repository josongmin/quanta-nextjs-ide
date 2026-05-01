import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  defaultConfig,
  generateRouteHandler,
  handlerFilePath,
  type RouteHandlerConfig,
} from './helpers';

const METHODS: RouteHandlerConfig['method'][] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

export function RouteHandlerWizardOverlay() {
  const open = useUiStore((s) => s.overlays.wizardRouteHandler.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [config, setConfig] = useState<RouteHandlerConfig>(() => defaultConfig());
  const code = useMemo(() => generateRouteHandler(config), [config]);

  const update = <K extends keyof RouteHandlerConfig>(
    key: K,
    value: RouteHandlerConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const file = handlerFilePath(config.path);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('wizardRouteHandler'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Route Handler Wizard</span>
        </span>
      }
      subtitle="method · runtime · auth · cache · webhook"
      size="md"
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={() => close('wizardRouteHandler')}>
            Cancel
          </Button>
          <Button
            size="sm"
            tone="default"
            onClick={() => {
              navigator.clipboard
                ?.writeText(code)
                .then(() => toast('Copied handler source to clipboard'))
                .catch(() => toast('Copy failed'));
            }}
          >
            <Icon.Doc className="h-3 w-3" /> Copy
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast(`Generated ${file} (mock)`, {
                description: `${config.method} ${config.path} · ${config.runtime} runtime`,
              })
            }
          >
            <Icon.Plus className="h-3 w-3" /> Generate
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[320px_1fr] gap-0">
        <div className="hairline-r p-3">
          <FieldGroup label="Path">
            <input
              type="text"
              value={config.path}
              onChange={(e) => update('path', e.target.value)}
              placeholder="/api/checkout"
              className={cn(
                'block w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-sm text-ink-1',
                'focus:outline-2 focus:outline-accent',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Method">
            <div className="flex flex-wrap gap-1">
              {METHODS.map((m) => {
                const active = config.method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update('method', m)}
                    className={cn(
                      'inline-flex h-6 items-center rounded-sm border px-1.5 text-[11px] font-mono tracking-caps',
                      active
                        ? 'border-accent/40 bg-accent-soft text-accent'
                        : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          <FieldGroup label="Runtime">
            <Radio
              name="runtime"
              value="node"
              current={config.runtime}
              onChange={(v) => update('runtime', v as RouteHandlerConfig['runtime'])}
              label="node"
            />
            <Radio
              name="runtime"
              value="edge"
              current={config.runtime}
              onChange={(v) => update('runtime', v as RouteHandlerConfig['runtime'])}
              label="edge"
            />
          </FieldGroup>

          <FieldGroup label="Body parsing">
            <Select
              value={config.bodyParse}
              onChange={(v) => update('bodyParse', v as RouteHandlerConfig['bodyParse'])}
            >
              <option value="raw">raw (text)</option>
              <option value="json">json</option>
              <option value="form-data">form-data</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Authentication">
            <Select
              value={config.auth}
              onChange={(v) => update('auth', v as RouteHandlerConfig['auth'])}
            >
              <option value="none">none</option>
              <option value="bearer">bearer token</option>
              <option value="session">session</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Rate limit">
            <Checkbox
              checked={config.rateLimit}
              onChange={(v) => update('rateLimit', v)}
              label="Enable rate limit"
            />
            {config.rateLimit ? (
              <NumberInput
                label="rps"
                value={config.rateLimitRps}
                onChange={(v) => update('rateLimitRps', v)}
                min={1}
                max={1000}
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Cache headers">
            <Checkbox
              checked={config.cacheHeaders}
              onChange={(v) => update('cacheHeaders', v)}
              label="Set cache-control"
            />
            {config.cacheHeaders ? (
              <NumberInput
                label="s-maxage"
                value={config.cacheMaxAge}
                onChange={(v) => update('cacheMaxAge', v)}
                min={0}
                max={86400}
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Webhook">
            <Checkbox
              checked={config.webhook}
              onChange={(v) => update('webhook', v)}
              label="Verify signature"
            />
            {config.webhook ? (
              <Select
                value={config.webhookProvider}
                onChange={(v) =>
                  update('webhookProvider', v as RouteHandlerConfig['webhookProvider'])
                }
              >
                <option value="stripe">stripe</option>
                <option value="github">github</option>
                <option value="generic">generic</option>
              </Select>
            ) : null}
          </FieldGroup>

          <FieldGroup label="Response envelope">
            <input
              type="text"
              value={config.responseEnvelope}
              onChange={(e) => update('responseEnvelope', e.target.value)}
              className={cn(
                'block w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1',
                'focus:outline-2 focus:outline-accent',
              )}
            />
          </FieldGroup>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 px-3 py-2 hairline-b">
            <div className="min-w-0">
              <div className="truncate font-mono text-[11px] text-ink-1">{file}</div>
              <div className="text-[10px] text-ink-3">
                {config.method} · {config.runtime} · {config.bodyParse}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Chip
                tone={config.runtime === 'edge' ? 'edge' : 'server'}
                size="xs"
                className="font-normal normal-case"
              >
                {config.runtime}
              </Chip>
              {config.cacheHeaders ? (
                <Chip tone="static" size="xs" className="font-normal normal-case">
                  cache
                </Chip>
              ) : null}
              {config.webhook ? (
                <Chip tone="warn" size="xs" className="font-normal normal-case">
                  webhook
                </Chip>
              ) : null}
            </div>
          </div>
          <div className="p-3">
            <CodeBlock code={code} language="ts" maxHeight={520} />
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 text-caps text-ink-3">{label}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange(v: string): void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1',
        'focus:outline-2 focus:outline-accent',
      )}
    >
      {children}
    </select>
  );
}

function Radio({
  name,
  value,
  current,
  onChange,
  label,
}: {
  name: string;
  value: string;
  current: string;
  onChange(v: string): void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-1">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="h-3 w-3 accent-[hsl(var(--accent))]"
      />
      <span>{label}</span>
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange(v: boolean): void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3 w-3 accent-[hsl(var(--accent))]"
      />
      <span>{label}</span>
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange(v: number): void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-1">
      <span className="w-16 text-[11px] text-ink-3">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(next)) onChange(next);
        }}
        className={cn(
          'block w-full rounded-sm border border-line bg-bg px-2 py-0.5 font-mono text-[11px] text-ink-1',
          'focus:outline-2 focus:outline-accent',
        )}
      />
    </label>
  );
}
