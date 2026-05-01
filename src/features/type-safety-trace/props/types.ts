/**
 * Props Origin Trace types — spec #20.
 */

import type { SymbolRef } from '../types';

export type PropChainKind =
  | 'literal'
  | 'parent-prop'
  | 'local'
  | 'hook'
  | 'import'
  | 'server-data'
  | 'unknown';

export interface PropChainStep {
  kind: PropChainKind;
  symbol: SymbolRef;
  /** Short snippet shown in the chain card. */
  snippet: string;
  /** Free-form annotation for the side rail (e.g. "from useUser()"). */
  note?: string;
}

export type SerializationRisk = 'safe' | 'maybe' | 'unsafe';

export interface PropOrigin {
  /** The JSX attribute under inspection. */
  jsxLocation: SymbolRef;
  /** Attribute name (e.g. `userId`). */
  propName: string;
  /** The component being mounted (e.g. `<UserCard …>`). */
  consumer: string;
  /** Origin chain, root → leaf. The last step is the proximate value. */
  chain: ReadonlyArray<PropChainStep>;
  /** Whether the chain crosses a server → client boundary unsafely. */
  serializationRisk: SerializationRisk;
  /** Reason text for the risk classification. */
  serializationReason?: string;
}
