export type PiiId =
  | 'email'
  | 'phone'
  | 'name'
  | 'dob'
  | 'address'
  | 'ip'
  | 'deviceId'
  | 'ssn';

export type GdprBasis = 'consent' | 'contract' | 'legitimate-interest';

export interface PiiSource {
  readonly id: string;
  readonly label: string;
}

export interface PiiProcessor {
  readonly id: string;
  readonly label: string;
  readonly kind: 'route' | 'action' | 'db' | 'queue';
  readonly retention: string;
  readonly encrypted: boolean;
  readonly auditLog: boolean;
}

export interface PiiDestination {
  readonly id: string;
  readonly label: string;
  readonly party: '3p';
}

export interface PiiField {
  readonly id: PiiId;
  readonly label: string;
  readonly sources: ReadonlyArray<string>;
  readonly processors: ReadonlyArray<string>;
  readonly destinations: ReadonlyArray<string>;
  readonly retention: string;
  readonly encrypted: boolean;
  readonly auditLog: boolean;
  readonly basis: GdprBasis;
  readonly erasureTargets: ReadonlyArray<string>;
}

export const SOURCES: ReadonlyArray<PiiSource> = [
  { id: 'sign-up', label: 'Sign-up form' },
  { id: 'profile', label: 'Profile form' },
  { id: 'checkout', label: 'Checkout form' },
  { id: 'support', label: 'Support form' },
  { id: 'http', label: 'HTTP request meta' },
];

export const PROCESSORS: ReadonlyArray<PiiProcessor> = [
  {
    id: 'auth-route',
    label: 'POST /api/auth',
    kind: 'route',
    retention: '90d',
    encrypted: true,
    auditLog: true,
  },
  {
    id: 'profile-action',
    label: 'updateProfile()',
    kind: 'action',
    retention: '5y',
    encrypted: true,
    auditLog: true,
  },
  {
    id: 'checkout-route',
    label: 'POST /api/checkout',
    kind: 'route',
    retention: '7y',
    encrypted: true,
    auditLog: true,
  },
  {
    id: 'users-db',
    label: 'users table',
    kind: 'db',
    retention: '7y',
    encrypted: true,
    auditLog: true,
  },
  {
    id: 'sessions-db',
    label: 'sessions table',
    kind: 'db',
    retention: '90d',
    encrypted: true,
    auditLog: false,
  },
  {
    id: 'orders-db',
    label: 'orders table',
    kind: 'db',
    retention: '7y',
    encrypted: true,
    auditLog: true,
  },
  {
    id: 'audit-queue',
    label: 'audit queue',
    kind: 'queue',
    retention: '13mo',
    encrypted: true,
    auditLog: true,
  },
];

export const DESTINATIONS: ReadonlyArray<PiiDestination> = [
  { id: 'stripe', label: 'Stripe', party: '3p' },
  { id: 'sendgrid', label: 'SendGrid', party: '3p' },
  { id: 's3', label: 'S3', party: '3p' },
  { id: 'sentry', label: 'Sentry', party: '3p' },
];

export const PII_FIELDS: ReadonlyArray<PiiField> = [
  {
    id: 'email',
    label: 'email',
    sources: ['sign-up', 'checkout', 'support'],
    processors: ['auth-route', 'users-db', 'audit-queue'],
    destinations: ['sendgrid', 'sentry'],
    retention: '5y',
    encrypted: true,
    auditLog: true,
    basis: 'contract',
    erasureTargets: ['users-db', 'sendgrid', 'sentry', 'audit-queue'],
  },
  {
    id: 'phone',
    label: 'phone',
    sources: ['profile', 'checkout'],
    processors: ['profile-action', 'users-db'],
    destinations: ['sendgrid'],
    retention: '3y',
    encrypted: true,
    auditLog: true,
    basis: 'consent',
    erasureTargets: ['users-db', 'sendgrid'],
  },
  {
    id: 'name',
    label: 'name',
    sources: ['sign-up', 'profile', 'checkout'],
    processors: ['auth-route', 'profile-action', 'users-db', 'orders-db'],
    destinations: ['stripe', 'sendgrid'],
    retention: '7y',
    encrypted: true,
    auditLog: true,
    basis: 'contract',
    erasureTargets: ['users-db', 'orders-db', 'stripe', 'sendgrid'],
  },
  {
    id: 'dob',
    label: 'date of birth',
    sources: ['profile'],
    processors: ['profile-action', 'users-db'],
    destinations: [],
    retention: '5y',
    encrypted: true,
    auditLog: true,
    basis: 'consent',
    erasureTargets: ['users-db'],
  },
  {
    id: 'address',
    label: 'shipping address',
    sources: ['checkout'],
    processors: ['checkout-route', 'orders-db'],
    destinations: ['stripe'],
    retention: '7y',
    encrypted: true,
    auditLog: true,
    basis: 'contract',
    erasureTargets: ['orders-db', 'stripe'],
  },
  {
    id: 'ip',
    label: 'ip address',
    sources: ['http'],
    processors: ['auth-route', 'sessions-db', 'audit-queue'],
    destinations: ['sentry'],
    retention: '90d',
    encrypted: false,
    auditLog: true,
    basis: 'legitimate-interest',
    erasureTargets: ['sessions-db', 'audit-queue', 'sentry'],
  },
  {
    id: 'deviceId',
    label: 'device id',
    sources: ['http'],
    processors: ['sessions-db', 'audit-queue'],
    destinations: [],
    retention: '180d',
    encrypted: false,
    auditLog: true,
    basis: 'legitimate-interest',
    erasureTargets: ['sessions-db', 'audit-queue'],
  },
  {
    id: 'ssn',
    label: 'national id',
    sources: ['profile'],
    processors: ['profile-action', 'users-db'],
    destinations: ['s3'],
    retention: '7y',
    encrypted: true,
    auditLog: true,
    basis: 'contract',
    erasureTargets: ['users-db', 's3'],
  },
];

export const BASIS_TONE: Record<GdprBasis, 'info' | 'accent' | 'warn'> = {
  consent: 'info',
  contract: 'accent',
  'legitimate-interest': 'warn',
};

export function piiById(id: PiiId): PiiField {
  return PII_FIELDS.find((f) => f.id === id) ?? PII_FIELDS[0]!;
}

export function processorById(id: string): PiiProcessor | undefined {
  return PROCESSORS.find((p) => p.id === id);
}

export function destLabel(id: string): string {
  return DESTINATIONS.find((d) => d.id === id)?.label ?? id;
}

export function processorLabel(id: string): string {
  return PROCESSORS.find((p) => p.id === id)?.label ?? id;
}
