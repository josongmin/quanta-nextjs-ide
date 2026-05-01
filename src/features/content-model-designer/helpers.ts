export type FieldType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'reference'
  | 'asset'
  | 'json'
  | 'array';

export interface Validations {
  readonly min?: number;
  readonly max?: number;
  readonly regex?: string;
}

export interface Field {
  readonly id: string;
  readonly name: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly localized: boolean;
  readonly defaultValue?: string;
  readonly validations?: Validations;
  readonly referenceTo?: string;
  readonly cardinality?: '1:1' | '1:N' | 'N:N';
  readonly description?: string;
}

export interface ContentType {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly fields: ReadonlyArray<Field>;
}

export const CONTENT_TYPES: ReadonlyArray<ContentType> = [
  {
    id: 'article',
    name: 'Article',
    icon: 'A',
    description: 'Blog or news entry',
    fields: [
      { id: 'title', name: 'title', type: 'text', required: true, localized: true, validations: { min: 4, max: 120 } },
      { id: 'slug', name: 'slug', type: 'text', required: true, localized: false, validations: { regex: '^[a-z0-9-]+$' } },
      { id: 'body', name: 'body', type: 'richtext', required: true, localized: true },
      { id: 'excerpt', name: 'excerpt', type: 'text', required: false, localized: true, validations: { max: 240 } },
      { id: 'cover', name: 'cover', type: 'asset', required: false, localized: false },
      { id: 'author', name: 'author', type: 'reference', required: true, localized: false, referenceTo: 'author', cardinality: '1:1' },
      { id: 'category', name: 'category', type: 'reference', required: false, localized: false, referenceTo: 'category', cardinality: '1:1' },
      { id: 'tags', name: 'tags', type: 'array', required: false, localized: false },
      { id: 'publishedAt', name: 'publishedAt', type: 'date', required: false, localized: false },
      { id: 'featured', name: 'featured', type: 'boolean', required: false, localized: false, defaultValue: 'false' },
    ],
  },
  {
    id: 'product',
    name: 'Product',
    icon: 'P',
    description: 'Catalog item',
    fields: [
      { id: 'name', name: 'name', type: 'text', required: true, localized: true, validations: { min: 2, max: 80 } },
      { id: 'sku', name: 'sku', type: 'text', required: true, localized: false, validations: { regex: '^[A-Z0-9-]+$' } },
      { id: 'priceMinor', name: 'priceMinor', type: 'number', required: true, localized: false, validations: { min: 0 } },
      { id: 'currency', name: 'currency', type: 'text', required: true, localized: false, defaultValue: 'USD' },
      { id: 'description', name: 'description', type: 'richtext', required: false, localized: true },
      { id: 'images', name: 'images', type: 'array', required: false, localized: false },
      { id: 'category', name: 'category', type: 'reference', required: true, localized: false, referenceTo: 'category', cardinality: '1:1' },
      { id: 'inStock', name: 'inStock', type: 'boolean', required: true, localized: false, defaultValue: 'true' },
      { id: 'meta', name: 'meta', type: 'json', required: false, localized: false },
    ],
  },
  {
    id: 'author',
    name: 'Author',
    icon: 'U',
    description: 'Article author',
    fields: [
      { id: 'name', name: 'name', type: 'text', required: true, localized: false, validations: { min: 2, max: 80 } },
      { id: 'handle', name: 'handle', type: 'text', required: true, localized: false, validations: { regex: '^[a-z0-9_]+$' } },
      { id: 'bio', name: 'bio', type: 'richtext', required: false, localized: true },
      { id: 'avatar', name: 'avatar', type: 'asset', required: false, localized: false },
      { id: 'twitter', name: 'twitter', type: 'text', required: false, localized: false },
      { id: 'joinedAt', name: 'joinedAt', type: 'date', required: false, localized: false },
    ],
  },
  {
    id: 'category',
    name: 'Category',
    icon: 'C',
    description: 'Taxonomy node',
    fields: [
      { id: 'name', name: 'name', type: 'text', required: true, localized: true },
      { id: 'slug', name: 'slug', type: 'text', required: true, localized: false, validations: { regex: '^[a-z0-9-]+$' } },
      { id: 'parent', name: 'parent', type: 'reference', required: false, localized: false, referenceTo: 'category', cardinality: '1:1' },
      { id: 'order', name: 'order', type: 'number', required: false, localized: false, defaultValue: '0' },
      { id: 'description', name: 'description', type: 'text', required: false, localized: true },
      { id: 'color', name: 'color', type: 'text', required: false, localized: false },
    ],
  },
  {
    id: 'landingPage',
    name: 'LandingPage',
    icon: 'L',
    description: 'Marketing landing page',
    fields: [
      { id: 'title', name: 'title', type: 'text', required: true, localized: true },
      { id: 'slug', name: 'slug', type: 'text', required: true, localized: false, validations: { regex: '^[a-z0-9-/]+$' } },
      { id: 'hero', name: 'hero', type: 'asset', required: false, localized: false },
      { id: 'sections', name: 'sections', type: 'array', required: false, localized: true },
      { id: 'featuredProducts', name: 'featuredProducts', type: 'reference', required: false, localized: false, referenceTo: 'product', cardinality: '1:N' },
      { id: 'authoredBy', name: 'authoredBy', type: 'reference', required: false, localized: false, referenceTo: 'author', cardinality: '1:1' },
      { id: 'meta', name: 'meta', type: 'json', required: false, localized: false },
      { id: 'publishedAt', name: 'publishedAt', type: 'date', required: false, localized: false },
    ],
  },
];

export function fieldTypeTone(t: FieldType): 'static' | 'info' | 'warn' | 'accent' | 'muted' {
  switch (t) {
    case 'text':
    case 'richtext':
      return 'static';
    case 'number':
    case 'boolean':
    case 'date':
      return 'info';
    case 'reference':
      return 'accent';
    case 'asset':
      return 'warn';
    case 'json':
    case 'array':
      return 'muted';
  }
}

export function generateZod(type: ContentType): string {
  const lines: string[] = ["import { z } from 'zod';", '', `export const ${cap(type.name)}Schema = z.object({`];
  for (const f of type.fields) {
    let zodType = 'z.unknown()';
    switch (f.type) {
      case 'text':
      case 'richtext':
        zodType = 'z.string()';
        if (f.validations?.min !== undefined) zodType += `.min(${f.validations.min})`;
        if (f.validations?.max !== undefined) zodType += `.max(${f.validations.max})`;
        if (f.validations?.regex !== undefined) zodType += `.regex(/${f.validations.regex}/)`;
        break;
      case 'number':
        zodType = 'z.number()';
        if (f.validations?.min !== undefined) zodType += `.min(${f.validations.min})`;
        if (f.validations?.max !== undefined) zodType += `.max(${f.validations.max})`;
        break;
      case 'boolean':
        zodType = 'z.boolean()';
        break;
      case 'date':
        zodType = 'z.coerce.date()';
        break;
      case 'reference':
        zodType = `z.string() /* -> ${f.referenceTo ?? '?'} */`;
        break;
      case 'asset':
        zodType = 'z.object({ url: z.string().url(), alt: z.string().optional() })';
        break;
      case 'json':
        zodType = 'z.record(z.unknown())';
        break;
      case 'array':
        zodType = 'z.array(z.string())';
        break;
    }
    if (!f.required) zodType += '.optional()';
    if (f.localized) zodType = `z.record(${zodType}) /* localized */`;
    lines.push(`  ${f.name}: ${zodType},`);
  }
  lines.push('});');
  lines.push('');
  lines.push(`export type ${cap(type.name)} = z.infer<typeof ${cap(type.name)}Schema>;`);
  return lines.join('\n');
}

export function generateGraphql(type: ContentType): string {
  const lines: string[] = [`type ${cap(type.name)} {`];
  for (const f of type.fields) {
    let gqlType = 'String';
    switch (f.type) {
      case 'text':
      case 'richtext':
        gqlType = 'String';
        break;
      case 'number':
        gqlType = 'Float';
        break;
      case 'boolean':
        gqlType = 'Boolean';
        break;
      case 'date':
        gqlType = 'DateTime';
        break;
      case 'reference':
        gqlType = cap(f.referenceTo ?? 'Node');
        if (f.cardinality === '1:N' || f.cardinality === 'N:N') gqlType = `[${gqlType}!]`;
        break;
      case 'asset':
        gqlType = 'Asset';
        break;
      case 'json':
        gqlType = 'JSON';
        break;
      case 'array':
        gqlType = '[String!]';
        break;
    }
    const bang = f.required ? '!' : '';
    lines.push(`  ${f.name}: ${gqlType}${bang}`);
  }
  lines.push('}');
  return lines.join('\n');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ReferenceEdge {
  readonly fromTypeId: string;
  readonly toTypeId: string;
  readonly fieldName: string;
  readonly cardinality: '1:1' | '1:N' | 'N:N';
}

export const FIELD_TYPES: ReadonlyArray<FieldType> = [
  'text',
  'richtext',
  'number',
  'boolean',
  'date',
  'reference',
  'asset',
  'json',
  'array',
];

export interface FieldOverride {
  readonly type?: FieldType;
  readonly required?: boolean;
  readonly localized?: boolean;
}

export function applyOverride(f: Field, o: FieldOverride | undefined): Field {
  if (!o) return f;
  return {
    ...f,
    ...(o.type ? { type: o.type } : {}),
    ...(o.required !== undefined ? { required: o.required } : {}),
    ...(o.localized !== undefined ? { localized: o.localized } : {}),
  };
}

export function referencesFrom(typeId: string): ReadonlyArray<ReferenceEdge> {
  const t = CONTENT_TYPES.find((x) => x.id === typeId);
  if (!t) return [];
  const out: ReferenceEdge[] = [];
  for (const f of t.fields) {
    if (f.type === 'reference' && f.referenceTo) {
      out.push({
        fromTypeId: typeId,
        toTypeId: f.referenceTo,
        fieldName: f.name,
        cardinality: f.cardinality ?? '1:1',
      });
    }
  }
  return out;
}
