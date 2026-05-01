'use cache';

// File-level `use cache` directive: the entire module is cacheable.
async function getProducts() {
  const res = await fetch('https://api.example.com/products');
  return res.json() as Promise<Array<{ id: string; title: string }>>;
}

export default async function CachedPage() {
  const products = await getProducts();
  return (
    <main>
      <h1>Cached page</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </main>
  );
}
