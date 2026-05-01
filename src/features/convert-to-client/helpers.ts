export interface ClientReason {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export interface ConvertTarget {
  readonly file: string;
  readonly beforeCode: string;
  readonly afterCode: string;
  readonly reasons: ReadonlyArray<ClientReason>;
  readonly blastKb: number;
  readonly suggestion: string;
}

const BEFORE = `import { fetchProduct } from '@/lib/data';

interface Props {
  id: string;
}

export async function ProductInteractive({ id }: Props) {
  const product = await fetchProduct(id);
  return (
    <div>
      <h2>{product.title}</h2>
      <input defaultValue={product.title} />
      <button>Save</button>
    </div>
  );
}`;

const AFTER = `'use client';

import { useState } from 'react';

interface Props {
  id: string;
  initialTitle: string;
}

export function ProductInteractive({ id, initialTitle }: Props) {
  const [title, setTitle] = useState(initialTitle);
  return (
    <div>
      <h2>{title}</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={() => save(id, title)}>Save</button>
    </div>
  );
}

function save(_id: string, _title: string) {
  // TODO: wire up
}`;

export const TARGET: ConvertTarget = {
  file: 'src/features/catalog/product-interactive.tsx',
  beforeCode: BEFORE,
  afterCode: AFTER,
  reasons: [
    {
      id: 'r1',
      label: 'event handlers',
      detail: 'onChange / onClick required for editing',
    },
    {
      id: 'r2',
      label: 'useState',
      detail: 'controlled input requires local state',
    },
    {
      id: 'r3',
      label: 'browser API',
      detail: 'navigator.clipboard reachable from button',
    },
  ],
  blastKb: 18.4,
  suggestion: 'Consider extracting only <SaveButton/> as a leaf island instead.',
};
