// Regex / token patterns used by the AST detector. Kept here so the heuristic
// is easy to tune from one place.

/** ORM/db method names that imply a write. */
export const MUTATION_METHODS: ReadonlySet<string> = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'insert',
  'set',
  'put',
  'patch',
  'execute',
]);

/** ORM method names that imply a read. */
export const READ_METHODS: ReadonlySet<string> = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'select',
  'get',
  'findById',
  'query',
]);

/** Identifier patterns that indicate the action carries an idempotency key. */
export const IDEMPOTENCY_NAMES: ReadonlySet<string> = new Set([
  'idempotencyKey',
  'idempotency_key',
  'requestId',
  'request_id',
  'clientToken',
  'client_token',
]);

/** Imports that strongly suggest unique-id generation (idempotency). */
export const ID_GEN_IMPORTS: ReadonlySet<string> = new Set([
  'ulid',
  'uuid',
  'nanoid',
  'cuid',
  'cuid2',
  'crypto', // Web Crypto.randomUUID
]);

/** Identifier names that imply the call is wrapped in a transaction. */
export const TRANSACTION_NAMES: ReadonlySet<string> = new Set([
  '$transaction',
  'transaction',
  'tx',
  'withTransaction',
  'serializable',
]);

/** Names that look like an entity row id. */
export const ID_PARAM_HINTS: ReadonlySet<string> = new Set([
  'id',
  'uid',
  'userId',
  'orderId',
  'productId',
]);

export function isMutation(method: string): boolean {
  return MUTATION_METHODS.has(method);
}

export function isRead(method: string): boolean {
  return READ_METHODS.has(method);
}
