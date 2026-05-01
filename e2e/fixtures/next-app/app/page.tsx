import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Routes</h1>
      <ul>
        <li><Link href="/static">Static (server-only)</Link></li>
        <li><Link href="/island">Client island</Link></li>
        <li><Link href="/suspense">Suspense + async</Link></li>
        <li><Link href="/action">Server action form</Link></li>
        <li><Link href="/products/walnut-table">Dynamic route</Link></li>
      </ul>
    </main>
  );
}
