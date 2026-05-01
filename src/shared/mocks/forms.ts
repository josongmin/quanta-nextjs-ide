import type { FormFlow } from '@shared/types';

/**
 * Form-pipeline mock data. Owns the literal so neither the
 * `form-pipeline` feature nor any `shared/mocks` re-export consumer
 * needs to hop upward through FSD layers.
 */
export const mockFormFlows: ReadonlyArray<FormFlow> = [
  {
    id: 'form_addToCart',
    name: 'addToCart',
    routeId: 'route_products_id',
    routePath: '/products/[id]',
    progressiveEnhancement: true,
    errorMappingComplete: true,
    stages: [
      {
        id: 's1',
        kind: 'field',
        label: 'fields { productId, qty }',
        file: 'components/AddToCartForm.client.tsx',
        line: 18,
        warnings: [],
      },
      {
        id: 's2',
        kind: 'schema',
        label: 'addToCartSchema',
        file: 'lib/schemas/cart.ts',
        line: 7,
        shape: `z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().int().min(1).max(99),
})`,
        warnings: [],
      },
      {
        id: 's3',
        kind: 'action',
        label: 'createCartItem(input)',
        file: 'app/(shop)/products/[id]/actions.ts',
        line: 22,
        warnings: [],
      },
      {
        id: 's4',
        kind: 'response',
        label: 'ActionResult<CartItem>',
        file: 'lib/action-result.ts',
        line: 12,
        shape: `type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string }`,
        warnings: [],
      },
      {
        id: 's5',
        kind: 'ui',
        label: 'useFormState → toast on error',
        file: 'components/AddToCartForm.client.tsx',
        line: 52,
        warnings: [],
      },
    ],
  },
  {
    id: 'form_checkout',
    name: 'checkout',
    routeId: 'route_checkout',
    routePath: '/checkout',
    progressiveEnhancement: false,
    errorMappingComplete: true,
    stages: [
      {
        id: 's1',
        kind: 'field',
        label: 'fields { address, payment, idempotencyKey }',
        file: 'components/CheckoutForm.client.tsx',
        line: 24,
        warnings: ['form requires JS — no <form action>'],
      },
      {
        id: 's2',
        kind: 'schema',
        label: 'checkoutSchema',
        file: 'lib/schemas/checkout.ts',
        line: 5,
        shape: `z.object({
  address: addressSchema,
  payment: paymentSchema,
  idempotencyKey: z.string().uuid(),
  // missing: shipping?
})`,
        warnings: ['shape drift: form sends shippingMethod, schema does not list it'],
      },
      {
        id: 's3',
        kind: 'action',
        label: 'createOrder(input)',
        file: 'app/(shop)/checkout/actions.ts',
        line: 30,
        warnings: [],
      },
      {
        id: 's4',
        kind: 'response',
        label: 'redirect → /orders/:id',
        file: 'app/(shop)/checkout/actions.ts',
        line: 88,
        warnings: [],
      },
      {
        id: 's5',
        kind: 'ui',
        label: 'router.push (client)',
        file: 'components/CheckoutForm.client.tsx',
        line: 92,
        warnings: ['fails when JS disabled'],
      },
    ],
  },
  {
    id: 'form_updateProduct',
    name: 'updateProduct (admin)',
    routeId: 'route_admin_products',
    routePath: '/admin/products',
    progressiveEnhancement: true,
    errorMappingComplete: false,
    stages: [
      {
        id: 's1',
        kind: 'field',
        label: 'fields { id, name, price }',
        file: 'app/admin/products/edit-form.tsx',
        line: 12,
        warnings: [],
      },
      {
        id: 's2',
        kind: 'schema',
        label: 'updateProductSchema',
        file: 'lib/schemas/product.ts',
        line: 14,
        shape: `z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(80),
  price: z.coerce.number().positive(),
})`,
        warnings: [],
      },
      {
        id: 's3',
        kind: 'action',
        label: 'updateProductAction',
        file: 'app/admin/products/actions.ts',
        line: 18,
        warnings: ['errors thrown, not returned'],
      },
      {
        id: 's4',
        kind: 'response',
        label: 'revalidateTag("products")',
        file: 'app/admin/products/actions.ts',
        line: 47,
        warnings: [],
      },
      {
        id: 's5',
        kind: 'ui',
        label: 'useState<Error|null>',
        file: 'app/admin/products/edit-form.tsx',
        line: 40,
        warnings: [
          'errors not mapped to fields',
          'should use useFormState (React 19)',
        ],
      },
    ],
  },
];
