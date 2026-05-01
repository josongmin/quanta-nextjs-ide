export type ActionStepKind =
  | 'auth'
  | 'validate'
  | 'authorize'
  | 'mutate'
  | 'side-effect'
  | 'revalidate'
  | 'redirect'
  | 'audit'
  | 'error';

export interface ActionStep {
  id: string;
  label: string;
  kind: ActionStepKind;
  startMs: number;
  durMs: number;
  ok: boolean;
  payload?: string;
}

export interface ActionRun {
  id: string;
  actionName: string;
  routeId: string;
  user: string;
  success: boolean;
  totalMs: number;
  steps: ActionStep[];
}

interface StepDraft {
  id: string;
  label: string;
  kind: ActionStepKind;
  durMs: number;
  ok?: boolean;
  payload?: string;
}

function buildSteps(drafts: ReadonlyArray<StepDraft>): ActionStep[] {
  let cursor = 0;
  return drafts.map((d) => {
    const step: ActionStep = {
      id: d.id,
      label: d.label,
      kind: d.kind,
      startMs: cursor,
      durMs: d.durMs,
      ok: d.ok ?? true,
      ...(d.payload !== undefined ? { payload: d.payload } : {}),
    };
    cursor += d.durMs;
    return step;
  });
}

function totalOf(steps: ReadonlyArray<ActionStep>): number {
  if (steps.length === 0) return 0;
  const last = steps[steps.length - 1];
  if (!last) return 0;
  return last.startMs + last.durMs;
}

const updateProductOk = buildSteps([
  { id: 's1', label: 'requireUser()', kind: 'auth', durMs: 4 },
  {
    id: 's2',
    label: 'zod.parse(updateProductSchema)',
    kind: 'validate',
    durMs: 3,
    payload: `{\n  "id": "p_4521",\n  "title": "Wireless Headphones",\n  "price": 19900\n}`,
  },
  { id: 's3', label: 'requireRole("admin")', kind: 'authorize', durMs: 6 },
  {
    id: 's4',
    label: 'db.products.update',
    kind: 'mutate',
    durMs: 38,
    payload: `UPDATE products\nSET title = $1, price = $2, updated_at = now()\nWHERE id = $3`,
  },
  { id: 's5', label: 'revalidateTag("products")', kind: 'revalidate', durMs: 8 },
  {
    id: 's6',
    label: 'audit.log(action=update_product)',
    kind: 'audit',
    durMs: 3,
  },
]);

const createOrderOk = buildSteps([
  { id: 's1', label: 'requireUser()', kind: 'auth', durMs: 4 },
  {
    id: 's2',
    label: 'zod.parse(createOrderSchema)',
    kind: 'validate',
    durMs: 5,
    payload: `{\n  "items": [{ "id": "p_8821", "qty": 2 }],\n  "address": { "city": "Seoul", ... }\n}`,
  },
  {
    id: 's3',
    label: 'tx[BEGIN]',
    kind: 'mutate',
    durMs: 2,
  },
  {
    id: 's4',
    label: 'db.orders.insert',
    kind: 'mutate',
    durMs: 22,
    payload: `INSERT INTO orders (...) VALUES (...)`,
  },
  {
    id: 's5',
    label: 'db.order_items.insertMany',
    kind: 'mutate',
    durMs: 18,
    payload: `INSERT INTO order_items (...) VALUES ($1...$N)`,
  },
  {
    id: 's6',
    label: 'db.inventory.decrement',
    kind: 'mutate',
    durMs: 14,
  },
  { id: 's7', label: 'tx[COMMIT]', kind: 'mutate', durMs: 3 },
  { id: 's8', label: 'revalidateTag("orders")', kind: 'revalidate', durMs: 7 },
  { id: 's9', label: 'redirect("/checkout/success")', kind: 'redirect', durMs: 1 },
]);

const createOrderFail = buildSteps([
  { id: 's1', label: 'requireUser()', kind: 'auth', durMs: 4 },
  {
    id: 's2',
    label: 'zod.parse(createOrderSchema)',
    kind: 'validate',
    durMs: 6,
    ok: false,
    payload: `ZodError: items must be a non-empty array\n  at path: items\n  received: []`,
  },
  {
    id: 's3',
    label: 'errorEnvelope({ code: "validation" })',
    kind: 'error',
    durMs: 2,
    ok: false,
  },
]);

const deleteUserFail = buildSteps([
  { id: 's1', label: 'requireUser()', kind: 'auth', durMs: 4 },
  { id: 's2', label: 'zod.parse(deleteUserSchema)', kind: 'validate', durMs: 2 },
  {
    id: 's3',
    label: 'requireRole("admin")',
    kind: 'authorize',
    durMs: 5,
    ok: false,
    payload: `ForbiddenError: required role "admin" missing\nactor.role = "user"`,
  },
  {
    id: 's4',
    label: 'errorEnvelope({ code: "forbidden" })',
    kind: 'error',
    durMs: 2,
    ok: false,
  },
]);

const updateProductSlow = buildSteps([
  { id: 's1', label: 'requireUser()', kind: 'auth', durMs: 4 },
  { id: 's2', label: 'zod.parse(updateProductSchema)', kind: 'validate', durMs: 3 },
  { id: 's3', label: 'requireRole("admin")', kind: 'authorize', durMs: 6 },
  {
    id: 's4',
    label: 'db.products.update',
    kind: 'mutate',
    durMs: 280,
    payload: `-- slow query, no index on (vendor_id, sku)\nUPDATE products SET ... WHERE vendor_id=$1 AND sku=$2`,
  },
  { id: 's5', label: 'revalidateTag("products")', kind: 'revalidate', durMs: 9 },
  { id: 's6', label: 'audit.log(...)', kind: 'audit', durMs: 4 },
]);

const webhookStripe = buildSteps([
  {
    id: 's1',
    label: 'verifySignature(headers, body)',
    kind: 'auth',
    durMs: 8,
    payload: `Stripe-Signature: t=1714478400,v1=...,v0=...`,
  },
  { id: 's2', label: 'zod.parse(stripeEvent)', kind: 'validate', durMs: 3 },
  {
    id: 's3',
    label: 'enqueue("payment.confirmed")',
    kind: 'side-effect',
    durMs: 12,
    payload: `{\n  "type": "payment.confirmed",\n  "payload": { "orderId": "o_4567" }\n}`,
  },
  { id: 's4', label: 'audit.log(stripe_event)', kind: 'audit', durMs: 2 },
]);

export const runs: ReadonlyArray<ActionRun> = [
  {
    id: 'run_1',
    actionName: 'updateProduct',
    routeId: 'route_admin_products',
    user: 'admin@acme.test',
    success: true,
    steps: updateProductOk,
    totalMs: totalOf(updateProductOk),
  },
  {
    id: 'run_2',
    actionName: 'createOrder',
    routeId: 'route_checkout',
    user: 'jane@example.com',
    success: true,
    steps: createOrderOk,
    totalMs: totalOf(createOrderOk),
  },
  {
    id: 'run_3',
    actionName: 'createOrder',
    routeId: 'route_checkout',
    user: 'guest@example.com',
    success: false,
    steps: createOrderFail,
    totalMs: totalOf(createOrderFail),
  },
  {
    id: 'run_4',
    actionName: 'deleteUser',
    routeId: 'route_admin_users_delete',
    user: 'staff@acme.test',
    success: false,
    steps: deleteUserFail,
    totalMs: totalOf(deleteUserFail),
  },
  {
    id: 'run_5',
    actionName: 'updateProduct',
    routeId: 'route_admin_products',
    user: 'admin@acme.test',
    success: true,
    steps: updateProductSlow,
    totalMs: totalOf(updateProductSlow),
  },
  {
    id: 'run_6',
    actionName: 'webhook:stripe',
    routeId: 'route_api_webhook_stripe',
    user: 'system',
    success: true,
    steps: webhookStripe,
    totalMs: totalOf(webhookStripe),
  },
];

export const ALL_KINDS: ReadonlyArray<ActionStepKind> = [
  'auth',
  'validate',
  'authorize',
  'mutate',
  'side-effect',
  'revalidate',
  'redirect',
  'audit',
  'error',
];

export function findRun(id: string | undefined): ActionRun {
  return runs.find((r) => r.id === id) ?? runs[0]!;
}
