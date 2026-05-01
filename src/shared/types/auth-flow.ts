/**
 * Auth-flow shape types.
 *
 * Lives in `shared/types` so both the `auth-flow-tracer` feature and the
 * `shared/mocks/auth-flow.ts` mock data can reference these without either
 * one having to depend on the other (FSD: shared sits below features).
 */

export type AuthHopKind =
  | 'cookie'
  | 'jwt-decode'
  | 'db'
  | 'cache'
  | 'middleware'
  | 'redirect'
  | 'render';

export interface AuthHop {
  id: string;
  label: string;
  file: string;
  line: number;
  kind: AuthHopKind;
  ms: number;
  safe: boolean;
  note?: string;
}

export interface CookieFlags {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

export interface AuthFlow {
  routeId: string;
  routePath: string;
  archetype: string;
  entry: string;
  hops: AuthHop[];
  csrfOK: boolean;
  sessionRefreshOK: boolean;
  cookieFlags: CookieFlags;
  weaknesses: ReadonlyArray<{ id: string; label: string; severity: 'err' | 'warn' | 'info' }>;
  sessionStrategy: string;
}
