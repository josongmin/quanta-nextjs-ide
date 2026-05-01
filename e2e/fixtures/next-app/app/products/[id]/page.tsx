import { Counter } from '../../island/Counter';

const PRODUCTS: Record<string, { title: string; priceCents: number; description: string }> = {
  'walnut-table': {
    title: 'Walnut Side Table',
    priceCents: 12900,
    description: 'Handcrafted from FSC walnut.',
  },
  'oak-shelf': {
    title: 'Oak Bookshelf',
    priceCents: 24900,
    description: 'Solid oak, dovetail joints.',
  },
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = PRODUCTS[id];
  if (!product) {
    return <main><h1>Not found: {id}</h1></main>;
  }
  return (
    <main>
      <h1>{product.title}</h1>
      <p>${(product.priceCents / 100).toFixed(2)}</p>
      <p>{product.description}</p>
      <Counter label="Add to cart" />
    </main>
  );
}
