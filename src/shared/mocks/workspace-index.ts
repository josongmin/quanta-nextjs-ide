// Extra mock source files used by the workspace-search overlay so the
// search corpus is rich enough to demo find/replace across many files.
import { mockSources } from './source-files';

export const extraSources: Record<string, string> = {
  'lib/products.ts': `import { db } from '@/lib/db'
import { unstable_cache } from 'next/cache'

export const getProduct = unstable_cache(async (id: string) => {
  return db.product.findUnique({ where: { id } })
}, ['product'], { revalidate: 60, tags: ['products'] })

export async function getReviews(productId: string) {
  return db.review.findMany({ where: { productId } })
}

export async function listFeatured() {
  return db.product.findMany({ where: { featured: true }, take: 12 })
}
`,
  'lib/db.ts': `import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const db = global.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.__prisma = db
`,
  'components/ProductDetail.tsx': `import Image from 'next/image'
import { Reviews } from './Reviews'
import type { Product, Review, Session } from '@/types'

interface Props {
  product: Product
  reviews: Review[]
  session: Session | null
}

export default function ProductDetail({ product, reviews, session }: Props) {
  return (
    <article className="grid grid-cols-2 gap-6">
      <Image src={product.imageUrl} alt={product.name} width={800} height={800} />
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-zinc-600">{product.description}</p>
        <p className="mt-4 text-xl font-mono">$\{product.price.toFixed(2)}</p>
        <Reviews reviews={reviews} canWrite={!!session} />
      </div>
    </article>
  )
}
`,
  'components/Reviews.tsx': `'use client'
import { useState } from 'react'
import type { Review } from '@/types'

export function Reviews({ reviews, canWrite }: { reviews: Review[]; canWrite: boolean }) {
  const [draft, setDraft] = useState('')
  return (
    <section>
      <h2 className="font-semibold">Reviews ({reviews.length})</h2>
      <ul>
        {reviews.map((r) => (
          <li key={r.id}>{r.body}</li>
        ))}
      </ul>
      {canWrite ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : null}
    </section>
  )
}
`,
  'components/AddToCart.client.tsx': `'use client'
import { useState, useTransition } from 'react'

export default function AddToCart({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition()
  const [count, setCount] = useState(1)
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={count}
        min={1}
        onChange={(e) => setCount(Number(e.target.value))}
      />
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch('/api/cart', {
              method: 'POST',
              body: JSON.stringify({ productId, count }),
            })
          })
        }
      >
        Add to cart
      </button>
    </div>
  )
}
`,
  'lib/services/order.ts': `import { db } from '@/lib/db'

export async function createOrderTx(formData: FormData) {
  const cartId = String(formData.get('cartId'))
  return db.$transaction(async (tx) => {
    const cart = await tx.cart.findUniqueOrThrow({ where: { id: cartId } })
    const order = await tx.order.create({ data: { cartId: cart.id, total: cart.total } })
    await tx.cart.delete({ where: { id: cart.id } })
    return order
  })
}
`,
  'lib/services/product.ts': `import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export const productService = {
  async update(data: { id: string; name: string; price: number }) {
    await db.product.update({ where: { id: data.id }, data })
    revalidateTag('products')
  },
  async list() {
    return db.product.findMany({ orderBy: { createdAt: 'desc' } })
  },
}
`,
  'app/api/cart/route.ts': `import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json()
  const cart = await db.cart.upsert({
    where: { id: body.cartId ?? '_anon' },
    update: { items: { push: body.productId } },
    create: { id: '_anon', items: [body.productId] },
  })
  return NextResponse.json(cart)
}
`,
};

export const workspaceIndex: Record<string, string> = {
  ...mockSources,
  ...extraSources,
};

export const workspaceFiles: ReadonlyArray<string> = Object.keys(workspaceIndex);
