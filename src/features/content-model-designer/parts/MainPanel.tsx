import { ScrollArea } from '@shared/ui';
import {
  applyOverride,
  referencesFrom,
  type ContentType,
  type Field,
  type FieldOverride,
} from '../helpers';
import { FieldRow } from './FieldRow';
import { RelationshipGraph } from './RelationshipGraph';

interface MainPanelProps {
  type: ContentType;
  orderedFields: ReadonlyArray<Field>;
  overrides: Record<string, FieldOverride>;
  onSetOverride(fieldId: string, patch: FieldOverride): void;
  onMove(fieldId: string, dir: -1 | 1): void;
}

export function MainPanel({
  type,
  orderedFields,
  overrides,
  onSetOverride,
  onMove,
}: MainPanelProps) {
  const refs = referencesFrom(type.id);
  return (
    <ScrollArea className="h-[560px]">
      <div className="p-3">
        <div className="text-[10px] uppercase tracking-caps text-ink-3">
          Fields — {type.name}
        </div>
        <ul className="mt-1 space-y-1">
          {orderedFields.length === 0 ? (
            <li className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
              No fields match filter.
            </li>
          ) : (
            orderedFields.map((f) => {
              const eff = applyOverride(f, overrides[`${type.id}.${f.id}`]);
              return (
                <FieldRow
                  key={f.id}
                  field={f}
                  effective={eff}
                  onSetOverride={(patch) => onSetOverride(f.id, patch)}
                  onMove={(dir) => onMove(f.id, dir)}
                />
              );
            })
          )}
        </ul>

        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Relationships
          </div>
          {refs.length === 0 ? (
            <div className="mt-1 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
              No references from {type.name}.
            </div>
          ) : (
            <RelationshipGraph fromName={type.name} edges={refs} />
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
