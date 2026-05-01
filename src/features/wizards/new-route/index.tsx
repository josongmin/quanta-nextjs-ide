import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Archetype } from '@shared/types';
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
  archetypeOptions,
  defaultConfigForArchetype,
  generateRouteFiles,
  type AuthGuard,
  type CacheStrategy,
  type GeneratedFile,
  type NewRouteConfig,
} from './helpers';

export function NewRouteWizardOverlay() {
  const open = useUiStore((s) => s.overlays.wizardNewRoute.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [archetype, setArchetype] = useState<Archetype>('commerce.product-detail');
  const [config, setConfig] = useState<NewRouteConfig>(() =>
    defaultConfigForArchetype('commerce.product-detail'),
  );
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    setConfig(defaultConfigForArchetype(archetype));
    setActiveFile(null);
  }, [archetype]);

  const files = useMemo<GeneratedFile[]>(
    () => generateRouteFiles(config),
    [config],
  );

  useEffect(() => {
    if (files.length === 0) {
      setActiveFile(null);
      return;
    }
    if (!activeFile || !files.some((f) => f.path === activeFile)) {
      setActiveFile(files[0]?.path ?? null);
    }
  }, [files, activeFile]);

  const update = <K extends keyof NewRouteConfig>(
    key: K,
    value: NewRouteConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const updateBoundary = (k: keyof NewRouteConfig['boundaries'], v: boolean) =>
    setConfig((prev) => ({
      ...prev,
      boundaries: { ...prev.boundaries, [k]: v },
    }));

  const activeSource =
    files.find((f) => f.path === activeFile)?.source ?? files[0]?.source ?? '';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('wizardNewRoute'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Plus className="h-4 w-4 text-ink-3" />
          <span>New Route Wizard</span>
        </span>
      }
      subtitle="archetype · path · boundaries · metadata · cache"
      size="md"
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={() => close('wizardNewRoute')}>
            Cancel
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast(`Generated ${files.length} files (mock)`, {
                description: files.map((f) => f.path).join(', '),
              })
            }
          >
            <Icon.Plus className="h-3 w-3" /> Generate route
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[300px_1fr] gap-0">
        <div className="hairline-r p-3">
          <FieldGroup label="Archetype">
            <Select
              value={archetype}
              onChange={(v) => setArchetype(v as Archetype)}
            >
              {archetypeOptions().map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup label="Path">
            <input
              type="text"
              value={config.path}
              onChange={(e) => update('path', e.target.value)}
              className={cn(
                'block w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-sm text-ink-1',
                'focus:outline-2 focus:outline-accent',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Group (optional)">
            <input
              type="text"
              placeholder="(shop)"
              value={config.group}
              onChange={(e) => update('group', e.target.value)}
              className={cn(
                'block w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-sm text-ink-1',
                'focus:outline-2 focus:outline-accent',
              )}
            />
          </FieldGroup>

          <FieldGroup label="Boundaries">
            <Checkbox
              checked={config.boundaries.loading}
              onChange={(v) => updateBoundary('loading', v)}
              label="loading.tsx"
            />
            <Checkbox
              checked={config.boundaries.error}
              onChange={(v) => updateBoundary('error', v)}
              label="error.tsx"
            />
            <Checkbox
              checked={config.boundaries.notFound}
              onChange={(v) => updateBoundary('notFound', v)}
              label="not-found.tsx"
            />
            <Checkbox
              checked={config.boundaries.default}
              onChange={(v) => updateBoundary('default', v)}
              label="default.tsx"
            />
            <Checkbox
              checked={config.boundaries.template}
              onChange={(v) => updateBoundary('template', v)}
              label="template.tsx"
            />
          </FieldGroup>

          <FieldGroup label="Metadata">
            <Checkbox
              checked={config.metadata}
              onChange={(v) => update('metadata', v)}
              label="generateMetadata()"
            />
          </FieldGroup>

          <FieldGroup label="Auth guard">
            <Select
              value={config.authGuard}
              onChange={(v) => update('authGuard', v as AuthGuard)}
            >
              <option value="none">none</option>
              <option value="requireUser">requireUser</option>
              <option value="requireRole">requireRole</option>
            </Select>
            {config.authGuard === 'requireRole' ? (
              <input
                type="text"
                value={config.authRole}
                onChange={(e) => update('authRole', e.target.value)}
                placeholder="admin"
                className={cn(
                  'mt-1 block w-full rounded-sm border border-line bg-bg px-2 py-1 text-sm text-ink-1',
                  'focus:outline-2 focus:outline-accent',
                )}
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Cache">
            <Select
              value={config.cache}
              onChange={(v) => update('cache', v as CacheStrategy)}
            >
              <option value="none">none</option>
              <option value="static">static</option>
              <option value="isr">ISR (revalidate)</option>
              <option value="dynamic">dynamic</option>
            </Select>
            {config.cache === 'isr' ? (
              <label className="mt-1 flex items-center gap-2 text-sm text-ink-1">
                <span className="w-16 text-[11px] text-ink-3">revalidate</span>
                <input
                  type="number"
                  value={config.revalidate}
                  min={0}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(n)) update('revalidate', n);
                  }}
                  className={cn(
                    'block w-full rounded-sm border border-line bg-bg px-2 py-0.5 font-mono text-[11px] text-ink-1',
                    'focus:outline-2 focus:outline-accent',
                  )}
                />
              </label>
            ) : null}
          </FieldGroup>
        </div>

        <div className="flex flex-col">
          <div className="px-3 py-2 hairline-b">
            <div className="text-caps text-ink-3">Files to create</div>
            <div className="mt-2 flex flex-col gap-0.5">
              {files.map((f) => {
                const active = f.path === activeFile;
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setActiveFile(f.path)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-left font-mono text-[11px]',
                      active
                        ? 'bg-accent-soft text-accent'
                        : 'text-ink-1 hover:bg-bg-hover',
                    )}
                  >
                    <Icon.File className="h-3 w-3" />
                    <span className="truncate">{f.path}</span>
                  </button>
                );
              })}
              {files.length === 0 ? (
                <div className="text-[11px] text-ink-3">
                  No files for current selection
                </div>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <Chip tone="muted" size="xs" className="font-normal normal-case">
                {files.length} files
              </Chip>
              <Chip
                tone={
                  config.cache === 'isr'
                    ? 'isr'
                    : config.cache === 'dynamic'
                      ? 'dynamic'
                      : 'static'
                }
                size="xs"
                className="font-normal normal-case"
              >
                {config.cache}
              </Chip>
              {config.authGuard !== 'none' ? (
                <Chip tone="warn" size="xs" className="font-normal normal-case">
                  {config.authGuard}
                </Chip>
              ) : null}
            </div>
          </div>
          <div className="p-3">
            <CodeBlock
              code={activeSource}
              language={
                activeFile?.endsWith('.ts')
                  ? 'ts'
                  : activeFile?.endsWith('.tsx')
                    ? 'tsx'
                    : 'tsx'
              }
              maxHeight={460}
            />
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
