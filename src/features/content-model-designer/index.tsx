import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  CONTENT_TYPES,
  applyOverride,
  generateGraphql,
  generateZod,
  type Field,
  type FieldOverride,
} from './helpers';
import { CodeRail } from './parts/CodeRail';
import { MainPanel } from './parts/MainPanel';
import { Toolbar } from './parts/Toolbar';
import { TypeList } from './parts/TypeList';

export function ContentModelDesignerOverlay() {
  const open = useUiStore((s) => s.overlays.contentModelDesigner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [typeId, setTypeId] = useState<string>(CONTENT_TYPES[0]?.id ?? 'article');
  const [relOnly, setRelOnly] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, FieldOverride>>({});
  const [order, setOrder] = useState<Record<string, ReadonlyArray<string>>>({});

  const type = CONTENT_TYPES.find((t) => t.id === typeId) ?? CONTENT_TYPES[0]!;

  const orderedFields = useMemo<ReadonlyArray<Field>>(() => {
    const customOrder = order[type.id];
    let fields = type.fields;
    if (customOrder) {
      const map = new Map(type.fields.map((f) => [f.id, f] as const));
      fields = customOrder
        .map((id) => map.get(id))
        .filter((f): f is Field => f !== undefined);
    }
    if (relOnly) {
      fields = fields.filter((f) => f.type === 'reference');
    }
    return fields;
  }, [type, order, relOnly]);

  const effectiveType = useMemo(() => {
    return {
      ...type,
      fields: type.fields.map((f) => applyOverride(f, overrides[`${type.id}.${f.id}`])),
    };
  }, [type, overrides]);

  function setOverride(fieldId: string, patch: FieldOverride) {
    setOverrides((prev) => ({
      ...prev,
      [`${type.id}.${fieldId}`]: { ...prev[`${type.id}.${fieldId}`], ...patch },
    }));
  }

  function moveField(fieldId: string, dir: -1 | 1) {
    const ids = (order[type.id] ?? type.fields.map((f) => f.id)).slice();
    const idx = ids.indexOf(fieldId);
    if (idx < 0) return;
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= ids.length) return;
    const a = ids[idx];
    const b = ids[swapWith];
    if (a === undefined || b === undefined) return;
    ids[idx] = b;
    ids[swapWith] = a;
    setOrder((prev) => ({ ...prev, [type.id]: ids }));
  }

  const zodCode = useMemo(() => generateZod(effectiveType), [effectiveType]);
  const gqlCode = useMemo(() => generateGraphql(effectiveType), [effectiveType]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('contentModelDesigner')}
      title="Content model designer"
      subtitle={`${CONTENT_TYPES.length} types · ${type.fields.length} fields in ${type.name}`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Generated TS types (mock)')}>
            Generate types
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Migration plan generated (mock)')}>
            Apply migration (mock)
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Exported Sanity/Contentful schema')}>
            Export schema
          </Button>
        </>
      }
    >
      <Toolbar
        typeId={typeId}
        onTypeChange={setTypeId}
        relOnly={relOnly}
        onRelOnlyToggle={() => setRelOnly((p) => !p)}
      />

      <div className="grid grid-cols-[260px_1fr_300px] divide-x divide-line">
        <TypeList typeId={typeId} onTypeChange={setTypeId} />
        <MainPanel
          type={type}
          orderedFields={orderedFields}
          overrides={overrides}
          onSetOverride={setOverride}
          onMove={moveField}
        />
        <CodeRail zodCode={zodCode} gqlCode={gqlCode} />
      </div>
    </OverlayPanel>
  );
}
