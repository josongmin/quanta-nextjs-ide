import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useCacheTagStore } from '@entities/cache-tag';
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
  defaultSchema,
  generateServerAction,
  type ServerActionConfig,
} from './helpers';

export function ServerActionWizardOverlay() {
  const open = useUiStore((s) => s.overlays.wizardServerAction.open);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);
  const tags = useCacheTagStore((s) => s.tags);

  const [config, setConfig] = useState<ServerActionConfig>(() => defaultConfig());

  const code = useMemo(() => generateServerAction(config), [config]);

  const update = <K extends keyof ServerActionConfig>(
    key: K,
    value: ServerActionConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (name: string) => {
    setConfig((prev) => ({
      ...prev,
      revalidateTags: prev.revalidateTags.includes(name)
        ? prev.revalidateTags.filter((t) => t !== name)
        : [...prev.revalidateTags, name],
    }));
  };

  const route = routes.find((r) => r.id === config.routeId) ?? null;
  const targetFile = route
    ? route.files.page?.replace(/page\.[tj]sx?$/, 'actions.ts') ??
      `app${route.path === '/' ? '' : route.path}/actions.ts`
    : 'app/actions.ts';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('wizardServerAction'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Server className="h-4 w-4 text-ink-3" />
          <span>Server Action Wizard</span>
        </span>
      }
      subtitle="schema · auth · mutation · revalidate"
      size="md"
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={() => close('wizardServerAction')}>
            Cancel
          </Button>
          <Button
            size="sm"
            tone="default"
            onClick={() => {
              navigator.clipboard
                ?.writeText(code)
                .then(() => toast('Copied action source to clipboard'))
                .catch(() => toast('Copy failed'));
            }}
          >
            <Icon.Doc className="h-3 w-3" /> Copy code
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast(`Generated ${targetFile} (mock)`, {
                description: `${config.name} · ${config.mutation} · ${config.revalidateTags.length} tags`,
              })
            }
          >
            <Icon.Plus className="h-3 w-3" /> Generate file
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[320px_1fr] gap-0">
        <div className="hairline-r p-3">
          <FieldGroup label="Action">
            <TextInput
              value={config.name}
              onChange={(v) => update('name', v)}
              placeholder="updateProduct"
            />
          </FieldGroup>

          <FieldGroup label="Route">
            <Select
              value={config.routeId ?? ''}
              onChange={(v) => update('routeId', v === '' ? null : v)}
            >
              <option value="">— none —</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.path}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup label="Authentication">
            <Radio
              name="auth"
              value="none"
              current={config.auth}
              onChange={(v) => update('auth', v as ServerActionConfig['auth'])}
              label="none"
            />
            <Radio
              name="auth"
              value="requireUser"
              current={config.auth}
              onChange={(v) => update('auth', v as ServerActionConfig['auth'])}
              label="requireUser"
            />
            <Radio
              name="auth"
              value="requireRole"
              current={config.auth}
              onChange={(v) => update('auth', v as ServerActionConfig['auth'])}
              label="requireRole"
            />
            {config.auth === 'requireRole' ? (
              <TextInput
                className="mt-1"
                value={config.role}
                onChange={(v) => update('role', v)}
                placeholder="admin"
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Mutation">
            <Select
              value={config.mutation}
              onChange={(v) => {
                const next = v as ServerActionConfig['mutation'];
                setConfig((prev) => ({
                  ...prev,
                  mutation: next,
                  schema: defaultSchema(next),
                }));
              }}
            >
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
              <option value="custom">custom</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Schema (zod)">
            <textarea
              value={config.schema}
              onChange={(e) => update('schema', e.target.value)}
              className={cn(
                'block h-32 w-full resize-none rounded-sm border border-line bg-bg px-2 py-1.5 font-mono text-[11px] text-ink-1',
                'focus:outline-2 focus:outline-accent',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Revalidation tags">
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => {
                const active = config.revalidateTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0 text-[11px] font-mono transition-colors',
                      active
                        ? 'border-accent/40 bg-accent-soft text-accent'
                        : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                    )}
                  >
                    <Icon.Tag className="h-2.5 w-2.5" />
                    {t.name}
                  </button>
                );
              })}
              {tags.length === 0 ? (
                <span className="text-[11px] text-ink-3">No cache tags found</span>
              ) : null}
            </div>
          </FieldGroup>

          <FieldGroup label="Behavior">
            <Checkbox
              checked={config.idempotent}
              onChange={(v) => update('idempotent', v)}
              label="Idempotent (require key)"
            />
            <Checkbox
              checked={config.audit}
              onChange={(v) => update('audit', v)}
              label="Audit log"
            />
            <Checkbox
              checked={config.transaction}
              onChange={(v) => update('transaction', v)}
              label="Wrap in transaction"
            />
          </FieldGroup>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 px-3 py-2 hairline-b">
            <div className="min-w-0">
              <div className="truncate font-mono text-[11px] text-ink-1">
                {targetFile}
              </div>
              <div className="text-[10px] text-ink-3">generated · live preview</div>
            </div>
            <div className="flex items-center gap-1">
              <Chip tone="server" size="xs" className="font-normal normal-case">
                'use server'
              </Chip>
              {config.transaction ? (
                <Chip tone="info" size="xs" className="font-normal normal-case">
                  tx
                </Chip>
              ) : null}
              {config.idempotent ? (
                <Chip tone="hint" size="xs" className="font-normal normal-case">
                  idempotent
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

function TextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange(v: string): void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1',
        'focus:outline-2 focus:outline-accent',
        className,
      )}
    />
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
