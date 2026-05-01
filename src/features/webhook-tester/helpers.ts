export type WebhookStatus = 'pending' | 'delivered' | 'failed' | 'retried';

export interface WebhookEvent {
  readonly id: string;
  readonly type: string;
  readonly status: WebhookStatus;
  readonly timestamp: string;
  readonly idempotencyKey: string;
  readonly attempts: number;
  readonly signatureValid: boolean;
  readonly dedupCount: number;
  readonly payload: string;
  readonly responseCode?: number;
  readonly responseSnippet?: string;
}

const json = (obj: unknown): string => JSON.stringify(obj, null, 2);

export const WEBHOOK_EVENTS: ReadonlyArray<WebhookEvent> = [
  {
    id: 'evt_001',
    type: 'payment_intent.succeeded',
    status: 'delivered',
    timestamp: '04-30 14:22:01',
    idempotencyKey: 'idem_pi_succ_a1f3',
    attempts: 1,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_001',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3OabcXYZ',
          amount: 14796,
          currency: 'usd',
          status: 'succeeded',
        },
      },
      created: 1714485721,
    }),
  },
  {
    id: 'evt_002',
    type: 'payment_intent.payment_failed',
    status: 'failed',
    timestamp: '04-30 14:25:09',
    idempotencyKey: 'idem_pi_fail_b2c4',
    attempts: 4,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 502,
    responseSnippet: 'Bad Gateway',
    payload: json({
      id: 'evt_002',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_3OdefABC',
          last_payment_error: { code: 'card_declined' },
        },
      },
    }),
  },
  {
    id: 'evt_003',
    type: 'invoice.paid',
    status: 'delivered',
    timestamp: '04-30 14:30:11',
    idempotencyKey: 'idem_inv_paid_c8d9',
    attempts: 1,
    signatureValid: true,
    dedupCount: 3,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_003',
      type: 'invoice.paid',
      data: { object: { id: 'in_1OabZ', total: 1900, status: 'paid' } },
    }),
  },
  {
    id: 'evt_004',
    type: 'invoice.payment_failed',
    status: 'retried',
    timestamp: '04-30 14:32:04',
    idempotencyKey: 'idem_inv_fail_d1e2',
    attempts: 3,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 500,
    responseSnippet: 'Internal Server Error',
    payload: json({
      id: 'evt_004',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_2OabY', attempt_count: 2 } },
    }),
  },
  {
    id: 'evt_005',
    type: 'customer.subscription.created',
    status: 'delivered',
    timestamp: '04-30 14:40:00',
    idempotencyKey: 'idem_sub_new_e3f4',
    attempts: 1,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_005',
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_1OXYZ', status: 'trialing' } },
    }),
  },
  {
    id: 'evt_006',
    type: 'customer.subscription.updated',
    status: 'delivered',
    timestamp: '04-30 14:45:33',
    idempotencyKey: 'idem_sub_upd_f5g6',
    attempts: 2,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_006',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1OXYZ', status: 'active' } },
    }),
  },
  {
    id: 'evt_007',
    type: 'customer.subscription.deleted',
    status: 'delivered',
    timestamp: '04-30 14:50:19',
    idempotencyKey: 'idem_sub_del_h7i8',
    attempts: 1,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_007',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1OABC', status: 'canceled' } },
    }),
  },
  {
    id: 'evt_008',
    type: 'charge.refunded',
    status: 'delivered',
    timestamp: '04-30 15:01:02',
    idempotencyKey: 'idem_chg_ref_j9k0',
    attempts: 1,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_008',
      type: 'charge.refunded',
      data: { object: { id: 'ch_3O123', amount_refunded: 500 } },
    }),
  },
  {
    id: 'evt_009',
    type: 'checkout.session.completed',
    status: 'delivered',
    timestamp: '04-30 15:11:48',
    idempotencyKey: 'idem_co_done_l1m2',
    attempts: 1,
    signatureValid: true,
    dedupCount: 2,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_009',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_a1', payment_status: 'paid' } },
    }),
  },
  {
    id: 'evt_010',
    type: 'customer.created',
    status: 'pending',
    timestamp: '04-30 15:18:00',
    idempotencyKey: 'idem_cu_new_n3o4',
    attempts: 0,
    signatureValid: true,
    dedupCount: 1,
    payload: json({
      id: 'evt_010',
      type: 'customer.created',
      data: { object: { id: 'cus_OabcZ', email: 'a@b.co' } },
    }),
  },
  {
    id: 'evt_011',
    type: 'product.updated',
    status: 'failed',
    timestamp: '04-30 15:25:11',
    idempotencyKey: 'idem_pr_upd_p5q6',
    attempts: 5,
    signatureValid: false,
    dedupCount: 1,
    responseCode: 401,
    responseSnippet: 'Invalid signature',
    payload: json({
      id: 'evt_011',
      type: 'product.updated',
      data: { object: { id: 'prod_OABC', name: 'Trail runners' } },
    }),
  },
  {
    id: 'evt_012',
    type: 'price.created',
    status: 'delivered',
    timestamp: '04-30 15:33:55',
    idempotencyKey: 'idem_pr_new_r7s8',
    attempts: 1,
    signatureValid: true,
    dedupCount: 1,
    responseCode: 200,
    responseSnippet: '{"received":true}',
    payload: json({
      id: 'evt_012',
      type: 'price.created',
      data: { object: { id: 'price_OabcXYZ', unit_amount: 1899 } },
    }),
  },
];

export function statusTone(s: WebhookStatus): 'static' | 'warn' | 'err' | 'info' {
  switch (s) {
    case 'delivered':
      return 'static';
    case 'pending':
      return 'info';
    case 'retried':
      return 'warn';
    case 'failed':
      return 'err';
  }
}

export function uniqueEventTypes(): ReadonlyArray<string> {
  return Array.from(new Set(WEBHOOK_EVENTS.map((e) => e.type)));
}
