import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  FIELD_TYPES,
  fieldTypeTone,
  type Field,
  type FieldOverride,
  type FieldType,
} from '../helpers';

interface FieldRowProps {
  field: Field;
  effective: Field;
  onSetOverride(patch: FieldOverride): void;
  onMove(dir: -1 | 1): void;
}

export function FieldRow({ field, effective, onSetOverride, onMove }: FieldRowProps) {
  return (
    <li className="grid grid-cols-[1fr_120px_auto_auto_auto_auto] items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-xs">
      <div className="min-w-0">
        <div className="font-mono text-ink-1">{field.name}</div>
        {field.referenceTo ? (
          <div className="text-[10px] text-ink-3">
            → {field.referenceTo} · {field.cardinality ?? '1:1'}
          </div>
        ) : null}
      </div>
      <select
        value={effective.type}
        onChange={(e) => onSetOverride({ type: e.target.value as FieldType })}
        className="h-6 rounded-sm border border-line bg-bg px-1 text-[11px] text-ink-1 focus:outline-none"
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <Chip tone={fieldTypeTone(effective.type)} size="xs">
        {effective.type}
      </Chip>
      <button
        type="button"
        onClick={() => onSetOverride({ required: !effective.required })}
        aria-pressed={effective.required}
        className={cn(
          'h-5 rounded-sm border border-line px-1.5 text-[10px]',
          effective.required ? 'bg-sev-warn-soft text-sev-warn' : 'bg-bg text-ink-3',
        )}
      >
        {effective.required ? 'req' : 'opt'}
      </button>
      <button
        type="button"
        onClick={() => onSetOverride({ localized: !effective.localized })}
        aria-pressed={effective.localized}
        className={cn(
          'h-5 rounded-sm border border-line px-1.5 text-[10px]',
          effective.localized ? 'bg-sev-info-soft text-sev-info' : 'bg-bg text-ink-3',
        )}
      >
        {effective.localized ? 'i18n' : 'mono'}
      </button>
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="xs" tone="ghost">
              rules
            </Button>
          </PopoverTrigger>
          <PopoverContent sideOffset={6} className="w-56 p-2 text-xs">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Validations
            </div>
            <dl className="mt-1 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-ink-3">min</dt>
                <dd className="font-mono text-ink-1">
                  {field.validations?.min ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-3">max</dt>
                <dd className="font-mono text-ink-1">
                  {field.validations?.max ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-3">regex</dt>
                <dd className="max-w-[140px] truncate font-mono text-ink-1">
                  {field.validations?.regex ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-3">default</dt>
                <dd className="font-mono text-ink-1">
                  {field.defaultValue ?? '—'}
                </dd>
              </div>
            </dl>
          </PopoverContent>
        </Popover>
        <Button size="xs" tone="ghost" onClick={() => onMove(-1)} aria-label="Move up">
          ↑
        </Button>
        <Button size="xs" tone="ghost" onClick={() => onMove(1)} aria-label="Move down">
          ↓
        </Button>
      </div>
    </li>
  );
}
