export interface DestinationOption {
  readonly id: string;
  readonly path: string;
  readonly suggested: boolean;
  readonly note: string;
}

export interface CallerFile {
  readonly id: string;
  readonly path: string;
  readonly oldImport: string;
  readonly newImport: string;
}

export interface MoveTarget {
  readonly symbol: string;
  readonly sourceFile: string;
  readonly beforeSource: string;
  readonly afterDestination: string;
  readonly destinations: ReadonlyArray<DestinationOption>;
  readonly callers: ReadonlyArray<CallerFile>;
}

const BEFORE_SOURCE = `// src/shared/lib/format.ts
export function formatPrice(n: number): string {
  return \`$\${(n / 100).toFixed(2)}\`;
}

// ⇣ moving symbol below
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function pluralize(s: string, n: number): string {
  return \`\${n} \${s}\${n === 1 ? '' : 's'}\`;
}`;

const AFTER_DEST = `// src/shared/lib/text.ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}`;

export const TARGET: MoveTarget = {
  symbol: 'slugify',
  sourceFile: 'src/shared/lib/format.ts',
  beforeSource: BEFORE_SOURCE,
  afterDestination: AFTER_DEST,
  destinations: [
    {
      id: 'd1',
      path: 'src/shared/lib/text.ts',
      suggested: true,
      note: 'matches naming · text utils',
    },
    {
      id: 'd2',
      path: 'src/shared/lib/url.ts',
      suggested: false,
      note: 'url helpers',
    },
    {
      id: 'd3',
      path: 'src/shared/lib/string-utils.ts',
      suggested: false,
      note: 'new file',
    },
  ],
  callers: [
    {
      id: 'k1',
      path: 'src/features/blog/post-card.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
    {
      id: 'k2',
      path: 'src/pages/blog/[slug]/page.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
    {
      id: 'k3',
      path: 'src/features/catalog/category-link.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
    {
      id: 'k4',
      path: 'src/widgets/header/category-menu.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
    {
      id: 'k5',
      path: 'src/features/search/search-suggest.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
    {
      id: 'k6',
      path: 'src/app/router.tsx',
      oldImport: "import { slugify } from '@shared/lib/format';",
      newImport: "import { slugify } from '@shared/lib/text';",
    },
  ],
};
