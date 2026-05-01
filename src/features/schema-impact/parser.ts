// Minimal Prisma + Drizzle schema parsers.
// Intentionally regex/line-based to avoid pulling @prisma/internals.

export type SchemaSource = 'prisma' | 'drizzle';

export interface ParsedField {
  name: string;
  type: string;
  nullable: boolean;
  isId: boolean;
  isUnique: boolean;
  isRelation: boolean;
  attrs: string[];
  defaultExpr?: string;
}

export interface ParsedModel {
  name: string;
  source: SchemaSource;
  tableName?: string;
  fields: ParsedField[];
  raw: string;
}

export interface SchemaSnapshot {
  source: SchemaSource;
  models: ParsedModel[];
}

const PRISMA_MODEL_RE = /model\s+(\w+)\s*{([^}]*)}/g;
const DRIZZLE_TABLE_RE =
  /export\s+const\s+(\w+)\s*=\s*(?:pg|mysql|sqlite)Table\(\s*['"]([^'"]+)['"]\s*,\s*{([\s\S]*?)\}\s*(?:,\s*\([\s\S]*?\)\s*=>\s*\([\s\S]*?\))?\s*\);?/g;

export function parsePrismaSchema(src: string): SchemaSnapshot {
  const models: ParsedModel[] = [];
  let match: RegExpExecArray | null;
  PRISMA_MODEL_RE.lastIndex = 0;
  while ((match = PRISMA_MODEL_RE.exec(src)) !== null) {
    const [, name, body] = match;
    if (!name || body == null) continue;
    const fields: ParsedField[] = [];
    let tableName: string | undefined;
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) continue;
      // Skip block-level @@map, @@index, etc but extract @@map.
      if (line.startsWith('@@')) {
        const m = /@@map\(\s*"([^"]+)"\s*\)/.exec(line);
        if (m) tableName = m[1];
        continue;
      }
      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;
      const fname = tokens[0]!;
      const ftypeRaw = tokens[1]!;
      const nullable = ftypeRaw.endsWith('?');
      const isList = ftypeRaw.endsWith('[]');
      const ftype = ftypeRaw.replace(/[?\[\]]/g, '');
      const rest = tokens.slice(2).join(' ');
      const attrs: string[] = [];
      const attrRe = /@[\w.]+(?:\([^)]*\))?/g;
      let am: RegExpExecArray | null;
      while ((am = attrRe.exec(rest)) !== null) attrs.push(am[0]);
      const isId = attrs.some((a) => a.startsWith('@id'));
      const isUnique = attrs.some((a) => a.startsWith('@unique'));
      const isRelation = attrs.some((a) => a.startsWith('@relation'));
      const defaultMatch = /@default\(([^)]+)\)/.exec(rest);
      fields.push({
        name: fname,
        type: isList ? `${ftype}[]` : ftype,
        nullable,
        isId,
        isUnique,
        isRelation,
        attrs,
        ...(defaultMatch ? { defaultExpr: defaultMatch[1] } : {}),
      });
    }
    models.push({
      name,
      source: 'prisma',
      ...(tableName ? { tableName } : {}),
      fields,
      raw: match[0],
    });
  }
  return { source: 'prisma', models };
}

const DRIZZLE_COL_TYPE_RE =
  /(\w+)\s*:\s*(\w+)\s*\(\s*(?:['"]([^'"]+)['"])?\s*[^)]*\)((?:\s*\.\w+\([^)]*\))*)/g;

export function parseDrizzleFile(src: string): SchemaSnapshot {
  const models: ParsedModel[] = [];
  let match: RegExpExecArray | null;
  DRIZZLE_TABLE_RE.lastIndex = 0;
  while ((match = DRIZZLE_TABLE_RE.exec(src)) !== null) {
    const [, varName, tableName, body] = match;
    if (!varName || !body) continue;
    const fields: ParsedField[] = [];
    let cm: RegExpExecArray | null;
    DRIZZLE_COL_TYPE_RE.lastIndex = 0;
    while ((cm = DRIZZLE_COL_TYPE_RE.exec(body)) !== null) {
      const [, fname, ftype, , chain = ''] = cm;
      if (!fname || !ftype) continue;
      const isId = /\.primaryKey\(/.test(chain);
      const isUnique = /\.unique\(/.test(chain);
      const notNull = /\.notNull\(/.test(chain);
      const defaultMatch = /\.default\(([^)]*)\)/.exec(chain);
      const attrs: string[] = [];
      if (isId) attrs.push('@id');
      if (isUnique) attrs.push('@unique');
      if (defaultMatch) attrs.push(`@default(${defaultMatch[1]})`);
      fields.push({
        name: fname,
        type: ftype,
        nullable: !notNull && !isId,
        isId,
        isUnique,
        isRelation: false,
        attrs,
        ...(defaultMatch && defaultMatch[1] ? { defaultExpr: defaultMatch[1] } : {}),
      });
    }
    models.push({
      name: varName,
      source: 'drizzle',
      tableName,
      fields,
      raw: match[0],
    });
  }
  return { source: 'drizzle', models };
}

export function mergeSnapshots(snapshots: SchemaSnapshot[]): SchemaSnapshot {
  const all: ParsedModel[] = [];
  for (const s of snapshots) all.push(...s.models);
  return { source: snapshots[0]?.source ?? 'prisma', models: all };
}
