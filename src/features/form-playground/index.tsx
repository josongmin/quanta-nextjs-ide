import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  a11yIssuesFor,
  schemas,
  validationLog,
  type FieldDef,
  type SchemaDef,
} from './helpers';

type Values = Record<string, unknown>;

function defaultValuesFor(s: SchemaDef): Values {
  const out: Values = {};
  for (const f of s.fields) {
    if (f.kind === 'checkbox') out[f.name] = false;
    else if (f.kind === 'number') out[f.name] = '';
    else if (f.kind === 'tags') out[f.name] = [] as string[];
    else if (f.kind === 'subform' && f.fields) {
      const sub: Record<string, unknown> = {};
      for (const ff of f.fields) {
        sub[ff.name] = ff.kind === 'checkbox' ? false : '';
      }
      out[f.name] = sub;
    } else out[f.name] = '';
  }
  return out;
}

function FieldInput({
  field,
  value,
  onChange,
  parent,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  parent?: string;
}): React.ReactElement {
  const id = parent ? `${parent}.${field.name}` : field.name;
  const baseInput =
    'h-7 w-full rounded-sm border border-line bg-bg px-2 text-[12px] text-ink-1 focus:outline-none focus:border-accent';

  if (field.kind === 'select') {
    return (
      <select
        id={id}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={baseInput}
      >
        <option value="">— select —</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (field.kind === 'checkbox') {
    return (
      <input
        id={id}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-accent"
      />
    );
  }
  if (field.kind === 'tags') {
    const arr = (value as string[]) ?? [];
    return (
      <div className="flex flex-wrap items-center gap-1 rounded-sm border border-line bg-bg p-1">
        {arr.map((t, i) => (
          <Chip key={`${t}-${i}`} tone="muted" size="xs">
            {t}
          </Chip>
        ))}
        <input
          id={id}
          type="text"
          placeholder="add tag…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) {
                onChange([...arr, v]);
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          className="min-w-[80px] flex-1 bg-transparent px-1 text-[12px] focus:outline-none"
        />
      </div>
    );
  }
  return (
    <input
      id={id}
      type={
        field.kind === 'email'
          ? 'email'
          : field.kind === 'password'
            ? 'password'
            : field.kind === 'number'
              ? 'number'
              : 'text'
      }
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
      required={field.required}
      min={field.min}
      max={field.max}
    />
  );
}

export function FormPlaygroundOverlay() {
  const open = useUiStore((s) => s.overlays.formPlayground.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [schemaId, setSchemaId] = useState<string>(schemas[0]?.id ?? '');
  const schema = useMemo(
    () => schemas.find((s) => s.id === schemaId) ?? schemas[0],
    [schemaId],
  );

  const [values, setValues] = useState<Values>(() =>
    schema ? defaultValuesFor(schema) : {},
  );

  if (!schema) return null;

  const issues = a11yIssuesFor(schema);
  const passCount = schema.fields.length - issues.length;

  const setVal = (name: string, v: unknown) =>
    setValues((m) => ({ ...m, [name]: v }));
  const setSubVal = (parent: string, name: string, v: unknown) =>
    setValues((m) => {
      const cur = (m[parent] as Record<string, unknown> | undefined) ?? {};
      return { ...m, [parent]: { ...cur, [name]: v } };
    });

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('formPlayground'))}
      title="Form playground"
      subtitle="Zod schema → form generator + a11y checker"
      size="xl"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              setValues(defaultValuesFor(schema));
              toast('Reset');
            }}
          >
            Reset
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Generated Zod from form (mock)')}
          >
            Generate Zod from form
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('Submitted (mock)')}
          >
            Submit (mock)
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Schema</span>
        {schemas.map((s) => (
          <ToggleChip
            key={s.id}
            active={schema.id === s.id}
            onClick={() => {
              setSchemaId(s.id);
              setValues(defaultValuesFor(s));
            }}
          >
            {s.name}
          </ToggleChip>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Schema source
            </div>
            <CodeBlock
              className="mt-1.5"
              code={schema.source}
              language="ts"
              showLineNumbers={true}
              maxHeight={420}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Generated form
            </div>
            <form
              className="mt-1.5 space-y-2 rounded-sm border border-line bg-bg p-3"
              onSubmit={(e) => {
                e.preventDefault();
                toast('Submitted (mock)');
              }}
            >
              {schema.fields.map((f) => {
                if (f.kind === 'subform' && f.fields) {
                  return (
                    <fieldset
                      key={f.name}
                      className="rounded-sm border border-dashed border-line p-2"
                    >
                      <legend className="px-1 text-[11px] font-medium text-ink-2">
                        {f.name}
                      </legend>
                      <div className="space-y-1.5">
                        {f.fields.map((sub) => (
                          <div
                            key={sub.name}
                            className="grid grid-cols-[100px_1fr] items-center gap-2"
                          >
                            <label
                              htmlFor={`${f.name}.${sub.name}`}
                              className="text-[11px] text-ink-2"
                            >
                              {sub.name}
                              {sub.required && (
                                <span className="text-sev-err">*</span>
                              )}
                            </label>
                            <FieldInput
                              field={sub}
                              parent={f.name}
                              value={
                                (values[f.name] as Record<string, unknown> | undefined)?.[
                                  sub.name
                                ]
                              }
                              onChange={(v) => setSubVal(f.name, sub.name, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  );
                }
                return (
                  <div
                    key={f.name}
                    className="grid grid-cols-[110px_1fr] items-center gap-2"
                  >
                    <label
                      htmlFor={f.name}
                      className="text-[11px] text-ink-2"
                    >
                      {f.name}
                      {f.required && <span className="text-sev-err">*</span>}
                    </label>
                    <FieldInput
                      field={f}
                      value={values[f.name]}
                      onChange={(v) => setVal(f.name, v)}
                    />
                  </div>
                );
              })}
            </form>

            <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
              A11y checker
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Chip tone="static" size="xs">
                {passCount} pass
              </Chip>
              <Chip tone="warn" size="xs">
                {issues.length} fail
              </Chip>
            </div>
            <ul className="mt-1.5 space-y-1">
              {issues.map((i) => (
                <li
                  key={i.id}
                  className={cn(
                    'rounded-sm border px-2 py-1 text-[11px]',
                    i.severity === 'err'
                      ? 'border-sev-err/40 bg-sev-err-soft'
                      : i.severity === 'warn'
                        ? 'border-sev-warn/40 bg-sev-warn-soft'
                        : 'border-sev-info/40 bg-sev-info-soft',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-ink-1">{i.field}</span>
                    <span className="text-[10px] uppercase tracking-caps text-ink-3">
                      {i.severity}
                    </span>
                  </div>
                  <div className="text-ink-2">{i.message}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Validation events
          </div>
          <ul className="mt-1 space-y-1">
            {validationLog.map((v) => (
              <li
                key={v.id}
                className="rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ink-1">{v.field}</span>
                  <span className="font-mono text-[10px] text-ink-3">{v.ts}</span>
                </div>
                <div className="text-sev-err">{v.error}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
