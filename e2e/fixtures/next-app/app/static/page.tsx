// Pure server component — no client islands.
export default function StaticPage() {
  return (
    <main>
      <h1>Static page</h1>
      <p>This page is rendered entirely on the server. No client components.</p>
      <ul>
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i}>Item {i + 1}</li>
        ))}
      </ul>
    </main>
  );
}
