import { Suspense } from 'react';

async function Slow({ name, ms }: { name: string; ms: number }) {
  await new Promise((r) => setTimeout(r, ms));
  return <li>{name} (resolved at +{ms}ms)</li>;
}

export default function MultiSuspensePage() {
  return (
    <main>
      <h1>Multiple Suspense boundaries</h1>
      <p>Three independent boundaries with different resolution timings.</p>
      <ul>
        <Suspense fallback={<li>Loading fast…</li>}>
          <Slow name="Fast" ms={50} />
        </Suspense>
        <Suspense fallback={<li>Loading mid…</li>}>
          <Slow name="Mid" ms={150} />
        </Suspense>
        <Suspense fallback={<li>Loading slow…</li>}>
          <Slow name="Slow" ms={300} />
        </Suspense>
      </ul>
    </main>
  );
}
