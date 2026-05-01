export type FieldKind =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'subform'
  | 'tags';

export interface FieldDef {
  name: string;
  kind: FieldKind;
  required?: boolean;
  min?: number;
  max?: number;
  options?: ReadonlyArray<string>;
  fields?: ReadonlyArray<FieldDef>;
}

export interface SchemaDef {
  id: string;
  name: string;
  source: string;
  fields: ReadonlyArray<FieldDef>;
}

export const schemas: ReadonlyArray<SchemaDef> = [
  {
    id: 'user',
    name: 'UserSignup',
    source: `import { z } from 'zod';

export const UserSignup = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(13).max(120),
  country: z.enum(['US', 'KR', 'JP', 'DE', 'UK']),
  agreedToTos: z.literal(true),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().regex(/^\\d{4,5}$/),
  }),
  tags: z.array(z.string()).max(5),
});`,
    fields: [
      { name: 'name', kind: 'text', required: true, min: 2 },
      { name: 'email', kind: 'email', required: true },
      { name: 'password', kind: 'password', required: true, min: 8 },
      { name: 'age', kind: 'number', required: true, min: 13, max: 120 },
      {
        name: 'country',
        kind: 'select',
        required: true,
        options: ['US', 'KR', 'JP', 'DE', 'UK'],
      },
      { name: 'agreedToTos', kind: 'checkbox', required: true },
      {
        name: 'address',
        kind: 'subform',
        fields: [
          { name: 'street', kind: 'text', required: true },
          { name: 'city', kind: 'text', required: true },
          { name: 'zip', kind: 'text', required: true },
        ],
      },
      { name: 'tags', kind: 'tags', max: 5 },
    ],
  },
  {
    id: 'product',
    name: 'ProductDraft',
    source: `import { z } from 'zod';

export const ProductDraft = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  price: z.number().positive(),
  inStock: z.boolean(),
  category: z.enum(['apparel', 'home', 'tech']),
  description: z.string().max(1000),
  tags: z.array(z.string()).max(8),
  meta: z.object({
    sku: z.string(),
    weightKg: z.number(),
  }),
});`,
    fields: [
      { name: 'title', kind: 'text', required: true, min: 3 },
      { name: 'slug', kind: 'text', required: true },
      { name: 'price', kind: 'number', required: true, min: 0 },
      { name: 'inStock', kind: 'checkbox' },
      {
        name: 'category',
        kind: 'select',
        required: true,
        options: ['apparel', 'home', 'tech'],
      },
      { name: 'description', kind: 'text' },
      { name: 'tags', kind: 'tags', max: 8 },
      {
        name: 'meta',
        kind: 'subform',
        fields: [
          { name: 'sku', kind: 'text', required: true },
          { name: 'weightKg', kind: 'number', required: true },
        ],
      },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback',
    source: `import { z } from 'zod';

export const Feedback = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(500),
  email: z.string().email().optional(),
  contactBack: z.boolean(),
  topic: z.enum(['bug', 'idea', 'thanks']),
  attachments: z.array(z.string()).max(3),
  device: z.object({
    os: z.string(),
    browser: z.string(),
  }),
  consent: z.literal(true),
});`,
    fields: [
      { name: 'rating', kind: 'number', required: true, min: 1, max: 5 },
      { name: 'comment', kind: 'text', required: true, min: 10 },
      { name: 'email', kind: 'email' },
      { name: 'contactBack', kind: 'checkbox' },
      {
        name: 'topic',
        kind: 'select',
        required: true,
        options: ['bug', 'idea', 'thanks'],
      },
      { name: 'attachments', kind: 'tags', max: 3 },
      {
        name: 'device',
        kind: 'subform',
        fields: [
          { name: 'os', kind: 'text', required: true },
          { name: 'browser', kind: 'text', required: true },
        ],
      },
      { name: 'consent', kind: 'checkbox', required: true },
    ],
  },
];

export interface A11yIssue {
  id: string;
  field: string;
  severity: 'err' | 'warn' | 'info';
  message: string;
}

export const a11yIssuesFor = (s: SchemaDef): ReadonlyArray<A11yIssue> => [
  {
    id: 'a1',
    field: 'agreedToTos',
    severity: 'warn',
    message: 'Required checkbox should have explicit <label for="…">',
  },
  {
    id: 'a2',
    field: s.fields[0]?.name ?? '',
    severity: 'info',
    message: 'Consider aria-describedby for inline help text',
  },
  {
    id: 'a3',
    field: 'password',
    severity: 'warn',
    message: 'Password contrast 3.8:1 on focus state — below 4.5:1',
  },
];

export interface ValidationEvent {
  id: string;
  ts: string;
  field: string;
  error: string;
}

export const validationLog: ReadonlyArray<ValidationEvent> = [
  { id: 'v1', ts: '14:02', field: 'email', error: 'invalid email' },
  { id: 'v2', ts: '14:02', field: 'password', error: 'must be ≥ 8 chars' },
  { id: 'v3', ts: '14:01', field: 'age', error: 'must be ≥ 13' },
  { id: 'v4', ts: '14:00', field: 'country', error: 'required' },
  { id: 'v5', ts: '13:59', field: 'address.zip', error: 'pattern mismatch' },
  { id: 'v6', ts: '13:58', field: 'agreedToTos', error: 'must be true' },
];
