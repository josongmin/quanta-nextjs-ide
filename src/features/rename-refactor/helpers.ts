export type OccurrenceKind = 'def' | 'read' | 'write' | 'comment' | 'string';

export interface Occurrence {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly kind: OccurrenceKind;
  /** snippet split into segments; the `match` segments are the old name. */
  readonly segments: ReadonlyArray<
    { readonly text: string; readonly match: boolean }
  >;
}

export interface Conflict {
  readonly id: string;
  readonly severity: 'warn' | 'err';
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
}

export interface RenameTarget {
  readonly oldName: string;
  readonly defaultNewName: string;
  readonly kind: 'function' | 'component' | 'hook' | 'const' | 'type' | 'class';
  readonly occurrences: ReadonlyArray<Occurrence>;
  readonly conflicts: ReadonlyArray<Conflict>;
}

const seg = (
  parts: ReadonlyArray<readonly [string, boolean]>,
): ReadonlyArray<{ text: string; match: boolean }> =>
  parts.map(([text, match]) => ({ text, match }));

export const TARGET: RenameTarget = {
  oldName: 'submitOrder',
  defaultNewName: 'placeOrder',
  kind: 'function',
  occurrences: [
    {
      id: 'o1',
      file: 'src/features/checkout/checkout.tsx',
      line: 138,
      kind: 'def',
      segments: seg([
        ['export async function ', false],
        ['submitOrder', true],
        ['(payload: OrderPayload): Promise<OrderResult> {', false],
      ]),
    },
    {
      id: 'o2',
      file: 'src/features/checkout/checkout.tsx',
      line: 24,
      kind: 'read',
      segments: seg([
        ['  const handlers = useCheckout(', false],
        ['submitOrder', true],
        [');', false],
      ]),
    },
    {
      id: 'o3',
      file: 'src/features/checkout/checkout.tsx',
      line: 4,
      kind: 'comment',
      segments: seg([
        ['// internal: ', false],
        ['submitOrder', true],
        [' was previously called placeOrder', false],
      ]),
    },
    {
      id: 'o4',
      file: 'src/pages/checkout/page.tsx',
      line: 9,
      kind: 'read',
      segments: seg([
        ['  const result = await ', false],
        ['submitOrder', true],
        ['(payload);', false],
      ]),
    },
    {
      id: 'o5',
      file: 'src/pages/checkout/page.tsx',
      line: 12,
      kind: 'write',
      segments: seg([
        ['  window.', false],
        ['submitOrder', true],
        [' = result;', false],
      ]),
    },
    {
      id: 'o6',
      file: 'src/features/checkout/checkout.test.ts',
      line: 8,
      kind: 'read',
      segments: seg([
        ["import { ", false],
        ['submitOrder', true],
        [" } from './checkout';", false],
      ]),
    },
    {
      id: 'o7',
      file: 'src/features/checkout/checkout.test.ts',
      line: 22,
      kind: 'def',
      segments: seg([
        ['export const ', false],
        ['submitOrder', true],
        [' = vi.fn(...);', false],
      ]),
    },
    {
      id: 'o8',
      file: 'src/features/checkout/checkout.test.ts',
      line: 35,
      kind: 'read',
      segments: seg([
        ['  expect(', false],
        ['submitOrder', true],
        [').toHaveBeenCalled();', false],
      ]),
    },
    {
      id: 'o9',
      file: 'src/features/checkout/checkout.test.ts',
      line: 41,
      kind: 'string',
      segments: seg([
        ["  it('", false],
        ['submitOrder', true],
        [" returns ok', () => {", false],
      ]),
    },
    {
      id: 'o10',
      file: 'src/features/checkout/charge.ts',
      line: 5,
      kind: 'comment',
      segments: seg([
        ['// called only from ', false],
        ['submitOrder', true],
        ['', false],
      ]),
    },
    {
      id: 'o11',
      file: 'src/features/checkout/charge.ts',
      line: 18,
      kind: 'read',
      segments: seg([
        ['  // see ', false],
        ['submitOrder', true],
        [' for orchestration', false],
      ]),
    },
    {
      id: 'o12',
      file: 'docs/checkout.md',
      line: 24,
      kind: 'string',
      segments: seg([
        ['the `', false],
        ['submitOrder', true],
        ['` function orchestrates the flow.', false],
      ]),
    },
    {
      id: 'o13',
      file: 'src/widgets/header/header.tsx',
      line: 5,
      kind: 'comment',
      segments: seg([
        ['// after ', false],
        ['submitOrder', true],
        [' resolves we close the drawer', false],
      ]),
    },
    {
      id: 'o14',
      file: 'src/app/store/editor.store.ts',
      line: 88,
      kind: 'read',
      segments: seg([
        ["    name: '", false],
        ['submitOrder', true],
        ["',", false],
      ]),
    },
  ],
  conflicts: [
    {
      id: 'c1',
      severity: 'warn',
      message:
        '`placeOrder` already exists in src/features/checkout/legacy.ts as a deprecated re-export.',
      file: 'src/features/checkout/legacy.ts',
      line: 4,
    },
    {
      id: 'c2',
      severity: 'warn',
      message:
        'Reserved keyword check passed, but `placeOrder` collides with a documented public API name.',
    },
  ],
};

export type Scope = 'project' | 'file' | 'selection';

export interface FileBucket {
  readonly file: string;
  readonly occurrences: ReadonlyArray<Occurrence>;
}

export function bucketByFile(
  occs: ReadonlyArray<Occurrence>,
): ReadonlyArray<FileBucket> {
  const map = new Map<string, Occurrence[]>();
  for (const o of occs) {
    const arr = map.get(o.file);
    if (arr) arr.push(o);
    else map.set(o.file, [o]);
  }
  return Array.from(map.entries()).map(([file, occurrences]) => ({
    file,
    occurrences,
  }));
}
