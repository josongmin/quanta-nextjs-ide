export interface FormField {
  readonly id: string;
  readonly name: string;
  readonly schema: string;
}

export interface ExtractActionTarget {
  readonly file: string;
  readonly defaultActionName: string;
  readonly defaultPath: string;
  readonly beforeCode: string;
  readonly afterClientCode: string;
  readonly afterServerCode: string;
  readonly fields: ReadonlyArray<FormField>;
  readonly defaultRevalidateTag: string;
}

const BEFORE = `'use client';

import { useState } from 'react';

export function NewOrderForm() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        sku: data.get('sku'),
        qty: Number(data.get('qty')),
        notes: data.get('notes'),
      }),
    });
    if (res.ok) await db.orders.bumpAnalytics();
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="sku" required />
      <input name="qty" type="number" required />
      <textarea name="notes" />
      <button type="submit" disabled={submitting}>Order</button>
    </form>
  );
}`;

const AFTER_CLIENT = `'use client';

import { createOrder } from '@/actions/orders';

export function NewOrderForm() {
  return (
    <form action={createOrder}>
      <input name="sku" required />
      <input name="qty" type="number" required />
      <textarea name="notes" />
      <button type="submit">Order</button>
    </form>
  );
}`;

const AFTER_SERVER = `'use server';

import { z } from 'zod';
import { db } from '@/server/db';
import { revalidateTag } from 'next/cache';

const Schema = z.object({
  sku: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export async function createOrder(formData: FormData) {
  const parsed = Schema.parse({
    sku: formData.get('sku'),
    qty: formData.get('qty'),
    notes: formData.get('notes'),
  });
  await db.orders.create(parsed);
  await db.orders.bumpAnalytics();
  revalidateTag('orders');
}`;

export const TARGET: ExtractActionTarget = {
  file: 'src/features/orders/new-order-form.tsx',
  defaultActionName: 'createOrder',
  defaultPath: 'src/actions/orders.ts',
  beforeCode: BEFORE,
  afterClientCode: AFTER_CLIENT,
  afterServerCode: AFTER_SERVER,
  fields: [
    { id: 'f1', name: 'sku', schema: 'z.string().min(1)' },
    { id: 'f2', name: 'qty', schema: 'z.coerce.number().int().positive()' },
    { id: 'f3', name: 'notes', schema: 'z.string().optional()' },
  ],
  defaultRevalidateTag: 'orders',
};
