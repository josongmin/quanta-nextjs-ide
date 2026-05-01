'use client';

import { useState } from 'react';

export function Counter({ label }: { label: string }) {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => setN((x) => x + 1)} style={{ padding: 8 }}>
      {label}: {n}
    </button>
  );
}
