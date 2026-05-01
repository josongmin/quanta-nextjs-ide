export type FieldType =
  | 'String'
  | 'Int'
  | 'BigInt'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Decimal'
  | 'UUID';

export interface ErField {
  name: string;
  type: FieldType;
  pk?: boolean;
  fk?: { model: string; field: string };
  nullable?: boolean;
  unique?: boolean;
}

export interface ErIndex {
  name: string;
  fields: string[];
  unique: boolean;
}

export interface ErModel {
  id: string;
  name: string;
  recordCount: number;
  fields: ErField[];
  indexes: ErIndex[];
  pos: { x: number; y: number };
}

export type RelationCardinality = '1:1' | '1:n' | 'n:n';

export interface ErRelation {
  id: string;
  fromModel: string;
  fromField: string;
  toModel: string;
  toField: string;
  cardinality: RelationCardinality;
}

export const erModels: ReadonlyArray<ErModel> = [
  {
    id: 'User',
    name: 'User',
    recordCount: 12_482,
    pos: { x: 60, y: 60 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'name', type: 'String', nullable: true },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'profileId', type: 'UUID', fk: { model: 'Profile', field: 'id' }, nullable: true },
    ],
    indexes: [
      { name: 'User_email_key', fields: ['email'], unique: true },
      { name: 'User_createdAt_idx', fields: ['createdAt'], unique: false },
    ],
  },
  {
    id: 'Profile',
    name: 'Profile',
    recordCount: 12_122,
    pos: { x: 420, y: 40 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'bio', type: 'String', nullable: true },
      { name: 'avatarUrl', type: 'String', nullable: true },
    ],
    indexes: [{ name: 'Profile_pkey', fields: ['id'], unique: true }],
  },
  {
    id: 'Post',
    name: 'Post',
    recordCount: 48_209,
    pos: { x: 60, y: 320 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'title', type: 'String' },
      { name: 'body', type: 'String' },
      { name: 'authorId', type: 'UUID', fk: { model: 'User', field: 'id' } },
      { name: 'publishedAt', type: 'DateTime', nullable: true },
    ],
    indexes: [
      { name: 'Post_authorId_idx', fields: ['authorId'], unique: false },
      { name: 'Post_publishedAt_idx', fields: ['publishedAt'], unique: false },
    ],
  },
  {
    id: 'Comment',
    name: 'Comment',
    recordCount: 122_980,
    pos: { x: 420, y: 320 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'body', type: 'String' },
      { name: 'authorId', type: 'UUID', fk: { model: 'User', field: 'id' } },
      { name: 'postId', type: 'UUID', fk: { model: 'Post', field: 'id' } },
      { name: 'createdAt', type: 'DateTime' },
    ],
    indexes: [
      { name: 'Comment_postId_idx', fields: ['postId'], unique: false },
    ],
  },
  {
    id: 'Tag',
    name: 'Tag',
    recordCount: 320,
    pos: { x: 800, y: 60 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'slug', type: 'String', unique: true },
      { name: 'label', type: 'String' },
    ],
    indexes: [{ name: 'Tag_slug_key', fields: ['slug'], unique: true }],
  },
  {
    id: 'PostTag',
    name: 'PostTag',
    recordCount: 96_511,
    pos: { x: 800, y: 320 },
    fields: [
      { name: 'postId', type: 'UUID', pk: true, fk: { model: 'Post', field: 'id' } },
      { name: 'tagId', type: 'UUID', pk: true, fk: { model: 'Tag', field: 'id' } },
    ],
    indexes: [
      { name: 'PostTag_pkey', fields: ['postId', 'tagId'], unique: true },
    ],
  },
  {
    id: 'AuditLog',
    name: 'AuditLog',
    recordCount: 581_002,
    pos: { x: 60, y: 580 },
    fields: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'actorId', type: 'UUID', fk: { model: 'User', field: 'id' }, nullable: true },
      { name: 'action', type: 'String' },
      { name: 'payload', type: 'Json' },
      { name: 'at', type: 'DateTime' },
    ],
    indexes: [
      { name: 'AuditLog_actorId_idx', fields: ['actorId'], unique: false },
      { name: 'AuditLog_at_idx', fields: ['at'], unique: false },
    ],
  },
];

export const erRelations: ReadonlyArray<ErRelation> = [
  { id: 'r1', fromModel: 'User', fromField: 'profileId', toModel: 'Profile', toField: 'id', cardinality: '1:1' },
  { id: 'r2', fromModel: 'Post', fromField: 'authorId', toModel: 'User', toField: 'id', cardinality: '1:n' },
  { id: 'r3', fromModel: 'Comment', fromField: 'authorId', toModel: 'User', toField: 'id', cardinality: '1:n' },
  { id: 'r4', fromModel: 'Comment', fromField: 'postId', toModel: 'Post', toField: 'id', cardinality: '1:n' },
  { id: 'r5', fromModel: 'PostTag', fromField: 'postId', toModel: 'Post', toField: 'id', cardinality: 'n:n' },
  { id: 'r6', fromModel: 'PostTag', fromField: 'tagId', toModel: 'Tag', toField: 'id', cardinality: 'n:n' },
  { id: 'r7', fromModel: 'AuditLog', fromField: 'actorId', toModel: 'User', toField: 'id', cardinality: '1:n' },
];

export const MODEL_WIDTH = 240;
export const ROW_HEIGHT = 22;
export const HEADER_HEIGHT = 30;

export function modelHeight(m: ErModel): number {
  return HEADER_HEIGHT + m.fields.length * ROW_HEIGHT + 6;
}

export function fieldRowY(m: ErModel, fieldName: string): number {
  const idx = m.fields.findIndex((f) => f.name === fieldName);
  if (idx < 0) return HEADER_HEIGHT;
  return HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
}

export function formatRecordCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
