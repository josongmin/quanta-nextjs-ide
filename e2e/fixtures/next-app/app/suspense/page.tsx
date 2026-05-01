import { Suspense } from 'react';

async function SlowList() {
  // Simulate a slow data fetch.
  await new Promise((r) => setTimeout(r, 200));
  return (
    <ul>
      <li>Walnut Side Table</li>
      <li>Oak Bookshelf</li>
      <li>Cherry Desk</li>
    </ul>
  );
}

export default function SuspensePage() {
  return (
    <main>
      <h1>Suspense + async</h1>
      <p>Outer shell renders immediately; inner list streams in.</p>
      <Suspense fallback={<p>Loading list…</p>}>
        <SlowList />
      </Suspense>
    </main>
  );
}
