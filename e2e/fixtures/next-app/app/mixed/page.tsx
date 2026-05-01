import { cookies, headers } from 'next/headers';

// Function-level `use cache` directive — only this fn is cached.
async function getCatalog() {
  'use cache';
  const res = await fetch('https://api.example.com/catalog');
  return res.json() as Promise<Array<{ id: string; name: string }>>;
}

// Pure function: a great candidate for `use cache` (no IO, no dynamic).
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// UNSAFE: reads cookies — caching would break per-user behavior.
async function getUserGreeting() {
  const c = await cookies();
  return `hello ${c.get('user')?.value ?? 'guest'}`;
}

// UNSAFE: uses headers() — request-scoped data.
async function getLocale() {
  const h = await headers();
  return h.get('accept-language') ?? 'en';
}

// UNSAFE: Date.now / Math.random — non-deterministic.
function getRequestId(): string {
  return `${Date.now()}-${Math.random()}`;
}

// UNSAFE: cache: 'no-store' fetch.
async function getLiveTicker() {
  const res = await fetch('https://api.example.com/ticker', { cache: 'no-store' });
  return res.json() as Promise<{ price: number }>;
}

export default async function MixedPage() {
  const [catalog, greeting, locale, ticker] = await Promise.all([
    getCatalog(),
    getUserGreeting(),
    getLocale(),
    getLiveTicker(),
  ]);
  return (
    <main>
      <h1>Mixed</h1>
      <p>{greeting} ({locale})</p>
      <p>Request: {getRequestId()}</p>
      <p>Ticker: {formatPrice(ticker.price)}</p>
      <ul>
        {catalog.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </main>
  );
}
