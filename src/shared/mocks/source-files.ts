// Mock source code for the editor — simulates a Next.js commerce app.
export const mockSources: Record<string, string> = {
  'app/(shop)/products/[id]/page.tsx': `import { notFound } from 'next/navigation'
import { getProduct, getReviews } from '@/lib/products'
import { getSession } from '@/lib/auth'
import ProductDetail from '@/components/ProductDetail'
import AddToCart from '@/components/AddToCart.client'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  return {
    title: product?.name ?? 'Product',
    description: product?.description,
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getSession()
  const { id } = params

  const product = await getProduct(id)
  const reviews = await getReviews(id)

  if (!product) notFound()

  return (
    <div>
      <ProductDetail product={product} reviews={reviews} session={session} />
      <AddToCart productId={product.id} />
    </div>
  )
}
`,
  'app/(shop)/layout.tsx': `import { cookies } from 'next/headers'
import AppShell from '@/components/AppShell'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const c = cookies()
  const cart = c.get('cart')
  return (
    <AppShell cart={cart?.value}>
      {children}
    </AppShell>
  )
}
`,
  'app/admin/products/actions.ts': `'use server'

import { z } from 'zod'
import { productService } from '@/lib/services/product'

const Schema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
})

export async function updateProduct(input: unknown) {
  const data = Schema.parse(input)
  await productService.update(data)
  return { ok: true }
}
`,
  'app/admin/users/delete/actions.ts': `'use server'

import { db } from '@/lib/db'

export async function deleteUser(formData: FormData) {
  const id = String(formData.get('id'))
  await db.user.delete({ where: { id } })
  return { ok: true }
}
`,
  'app/(shop)/checkout/actions.ts': `'use server'

import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
import { createOrderTx } from '@/lib/services/order'

export async function createOrder(formData: FormData) {
  try {
    const order = await createOrderTx(formData)
    revalidateTag('orders')
    redirect('/orders/' + order.id)
  } catch (e) {
    console.error(e)
    return { ok: false }
  }
}
`,
  'lib/auth.ts': `import { cookies } from 'next/headers'

export async function getSession() {
  const c = cookies()
  return decode(c.get('session')?.value)
}

function decode(_v: string | undefined) {
  return null
}
`,
};

export function getSourceForFile(file: string): string {
  return (
    mockSources[file] ??
    `// ${file}\n// (mock source not provided)\nexport {}\n`
  );
}
