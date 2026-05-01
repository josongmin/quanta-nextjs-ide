import { Counter } from './Counter';

export default function IslandPage() {
  return (
    <main>
      <h1>Client island</h1>
      <p>Server-rendered shell with a single client component.</p>
      <Counter label="Clicks" />
    </main>
  );
}
