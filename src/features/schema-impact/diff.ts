import type { ParsedField, ParsedModel, SchemaSnapshot } from './parser';

export type SchemaChangeKind =
  | 'model-added'
  | 'model-removed'
  | 'field-added'
  | 'field-removed'
  | 'field-renamed'
  | 'field-type-changed'
  | 'field-nullability-changed'
  | 'field-constraint-changed';

export interface SchemaChange {
  id: string;
  kind: SchemaChangeKind;
  model: string;
  field?: string;
  before?: string;
  after?: string;
  detail: string;
}

function fieldByName(model: ParsedModel, name: string): ParsedField | undefined {
  return model.fields.find((f) => f.name === name);
}

function describeField(f: ParsedField): string {
  return `${f.type}${f.nullable ? '?' : ''}${f.isId ? ' @id' : ''}${
    f.isUnique ? ' @unique' : ''
  }`;
}

export function diffSnapshots(
  before: SchemaSnapshot,
  after: SchemaSnapshot,
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  const beforeByName = new Map(before.models.map((m) => [m.name, m]));
  const afterByName = new Map(after.models.map((m) => [m.name, m]));

  for (const [name, model] of afterByName) {
    if (!beforeByName.has(name)) {
      changes.push({
        id: `model-add:${name}`,
        kind: 'model-added',
        model: name,
        detail: `Model ${name} added with ${model.fields.length} fields`,
      });
    }
  }
  for (const [name] of beforeByName) {
    if (!afterByName.has(name)) {
      changes.push({
        id: `model-rm:${name}`,
        kind: 'model-removed',
        model: name,
        detail: `Model ${name} removed`,
      });
    }
  }

  for (const [name, beforeModel] of beforeByName) {
    const afterModel = afterByName.get(name);
    if (!afterModel) continue;
    const beforeFields = new Map(beforeModel.fields.map((f) => [f.name, f]));
    const afterFields = new Map(afterModel.fields.map((f) => [f.name, f]));

    // Heuristic rename detection: a removed field + an added field with the
    // same type position is treated as a rename.
    const removed: string[] = [];
    const added: string[] = [];
    for (const [n] of beforeFields) if (!afterFields.has(n)) removed.push(n);
    for (const [n] of afterFields) if (!beforeFields.has(n)) added.push(n);

    const renamed = new Set<string>();
    for (const r of removed) {
      const beforeField = beforeFields.get(r)!;
      const candidate = added.find((a) => {
        const af = afterFields.get(a);
        return af && af.type === beforeField.type && af.isId === beforeField.isId;
      });
      if (candidate) {
        renamed.add(r);
        renamed.add(candidate);
        changes.push({
          id: `rename:${name}.${r}->${candidate}`,
          kind: 'field-renamed',
          model: name,
          field: candidate,
          before: r,
          after: candidate,
          detail: `${name}.${r} → ${name}.${candidate}`,
        });
      }
    }

    for (const r of removed) {
      if (renamed.has(r)) continue;
      changes.push({
        id: `field-rm:${name}.${r}`,
        kind: 'field-removed',
        model: name,
        field: r,
        before: describeField(beforeFields.get(r)!),
        detail: `Field ${name}.${r} removed`,
      });
    }
    for (const a of added) {
      if (renamed.has(a)) continue;
      changes.push({
        id: `field-add:${name}.${a}`,
        kind: 'field-added',
        model: name,
        field: a,
        after: describeField(afterFields.get(a)!),
        detail: `Field ${name}.${a} added`,
      });
    }

    for (const [fname, bf] of beforeFields) {
      const af = fieldByName(afterModel, fname);
      if (!af) continue;
      if (af.type !== bf.type) {
        changes.push({
          id: `type:${name}.${fname}`,
          kind: 'field-type-changed',
          model: name,
          field: fname,
          before: bf.type,
          after: af.type,
          detail: `${name}.${fname} type ${bf.type} → ${af.type}`,
        });
      }
      if (af.nullable !== bf.nullable) {
        changes.push({
          id: `null:${name}.${fname}`,
          kind: 'field-nullability-changed',
          model: name,
          field: fname,
          before: bf.nullable ? 'nullable' : 'required',
          after: af.nullable ? 'nullable' : 'required',
          detail: `${name}.${fname} ${bf.nullable ? 'nullable' : 'required'} → ${
            af.nullable ? 'nullable' : 'required'
          }`,
        });
      }
      if (af.isUnique !== bf.isUnique || af.isId !== bf.isId) {
        changes.push({
          id: `constraint:${name}.${fname}`,
          kind: 'field-constraint-changed',
          model: name,
          field: fname,
          before: describeField(bf),
          after: describeField(af),
          detail: `${name}.${fname} constraints changed`,
        });
      }
    }
  }
  return changes;
}
