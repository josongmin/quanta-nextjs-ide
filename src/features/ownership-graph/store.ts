/**
 * Ownership store.
 *
 * Holds:
 *  - the parsed CODEOWNERS rules (rebuilt from raw text)
 *  - manual overrides (path → team) the user adds in the UI when the
 *    repo doesn't yet have a CODEOWNERS file
 *  - team metadata: display name, color, seniority tags
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parseCodeowners, type CodeownersRule } from './parser';

export interface TeamMeta {
  /** The owner key as it appears in CODEOWNERS, e.g. `@org/payments`. */
  id: string;
  label: string;
  /** A reasonably-distinct color so file dots stand out. */
  color: string;
  /** Members tagged "senior" — feeds risk-based reviewer suggestions. */
  seniors: string[];
}

export interface ManualOverride {
  /** Glob pattern, same syntax as CODEOWNERS. */
  pattern: string;
  owners: string[];
}

interface OwnershipState {
  rawCodeowners: string;
  rules: ReadonlyArray<CodeownersRule>;
  parseErrors: ReadonlyArray<{ line: number; message: string }>;
  teams: Record<string, TeamMeta>;
  overrides: ManualOverride[];
  setRawCodeowners(raw: string): void;
  upsertTeam(team: TeamMeta): void;
  removeTeam(id: string): void;
  addOverride(override: ManualOverride): void;
  removeOverride(index: number): void;
  reset(): void;
}

const DEFAULT_TEAMS: Record<string, TeamMeta> = {
  '@org/payments': {
    id: '@org/payments',
    label: 'Payments',
    color: '#f59e0b',
    seniors: ['@minji', '@taro'],
  },
  '@org/auth': {
    id: '@org/auth',
    label: 'Auth',
    color: '#6366f1',
    seniors: ['@kira'],
  },
  '@org/web': {
    id: '@org/web',
    label: 'Web',
    color: '#22c55e',
    seniors: [],
  },
};

const DEFAULT_CODEOWNERS = `# Sample — replace with .github/CODEOWNERS contents.
src/app/checkout/**       @org/payments
src/lib/services/payment* @org/payments
src/lib/auth/**           @org/auth
src/components/**         @org/web
*                         @org/web
`;

const initialParse = parseCodeowners(DEFAULT_CODEOWNERS);

export const useOwnershipStore = create<OwnershipState>()(
  persist(
    (set) => ({
      rawCodeowners: DEFAULT_CODEOWNERS,
      rules: initialParse.rules,
      parseErrors: initialParse.errors,
      teams: DEFAULT_TEAMS,
      overrides: [],
      setRawCodeowners: (raw) =>
        set(() => {
          const parsed = parseCodeowners(raw);
          return {
            rawCodeowners: raw,
            rules: parsed.rules,
            parseErrors: parsed.errors,
          };
        }),
      upsertTeam: (team) =>
        set((s) => ({ teams: { ...s.teams, [team.id]: team } })),
      removeTeam: (id) =>
        set((s) => {
          const next = { ...s.teams };
          delete next[id];
          return { teams: next };
        }),
      addOverride: (override) =>
        set((s) => ({ overrides: [...s.overrides, override] })),
      removeOverride: (index) =>
        set((s) => ({ overrides: s.overrides.filter((_, i) => i !== index) })),
      reset: () =>
        set(() => ({
          rawCodeowners: DEFAULT_CODEOWNERS,
          rules: initialParse.rules,
          parseErrors: initialParse.errors,
          teams: DEFAULT_TEAMS,
          overrides: [],
        })),
    }),
    {
      name: 'quanta.ownershipGraph',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        rawCodeowners: s.rawCodeowners,
        teams: s.teams,
        overrides: s.overrides,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Rebuild rules from persisted raw text.
        const parsed = parseCodeowners(state.rawCodeowners);
        state.rules = parsed.rules;
        state.parseErrors = parsed.errors;
      },
    },
  ),
);
