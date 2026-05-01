export type Role = 'viewer' | 'editor' | 'maintainer' | 'admin' | 'superadmin';
export type CellStatus = 'allow' | 'conditional' | 'deny';
export type PermGroup = 'Content' | 'Settings' | 'Billing' | 'Admin';

export interface PermissionDef {
  readonly id: string;
  readonly label: string;
  readonly group: PermGroup;
  readonly description: string;
}

export interface MatrixCell {
  readonly status: CellStatus;
  readonly rule?: string;
  readonly evidence: string;
  readonly testsPass: boolean;
}

export const ROLES: ReadonlyArray<Role> = [
  'viewer',
  'editor',
  'maintainer',
  'admin',
  'superadmin',
];

export const PERMISSIONS: ReadonlyArray<PermissionDef> = [
  { id: 'article.read', label: 'Read article', group: 'Content', description: 'View published article' },
  { id: 'article.write', label: 'Write article', group: 'Content', description: 'Create/update draft' },
  { id: 'article.publish', label: 'Publish article', group: 'Content', description: 'Move from draft to published' },
  { id: 'article.delete', label: 'Delete article', group: 'Content', description: 'Soft delete' },
  { id: 'asset.upload', label: 'Upload asset', group: 'Content', description: 'Upload images / files' },
  { id: 'asset.delete', label: 'Delete asset', group: 'Content', description: 'Permanently remove asset' },
  { id: 'comment.moderate', label: 'Moderate comments', group: 'Content', description: 'Approve/hide comments' },
  { id: 'settings.read', label: 'Read settings', group: 'Settings', description: 'View site config' },
  { id: 'settings.write', label: 'Write settings', group: 'Settings', description: 'Edit site config' },
  { id: 'theme.write', label: 'Edit theme', group: 'Settings', description: 'Change global theme tokens' },
  { id: 'billing.read', label: 'Read billing', group: 'Billing', description: 'View invoices/usage' },
  { id: 'billing.write', label: 'Manage billing', group: 'Billing', description: 'Update payment, plan' },
  { id: 'plan.change', label: 'Change plan', group: 'Billing', description: 'Up/downgrade subscription' },
  { id: 'user.invite', label: 'Invite users', group: 'Admin', description: 'Send invitations' },
  { id: 'user.manage', label: 'Manage users', group: 'Admin', description: 'Suspend / remove users' },
  { id: 'apikeys.manage', label: 'Manage API keys', group: 'Admin', description: 'Create / revoke keys' },
  { id: 'webhooks.manage', label: 'Manage webhooks', group: 'Admin', description: 'Subscribe / rotate' },
  { id: 'audit.read', label: 'Read audit log', group: 'Admin', description: 'View admin activity' },
];

const cell = (
  status: CellStatus,
  evidence: string,
  testsPass: boolean,
  rule?: string,
): MatrixCell => ({
  status,
  evidence,
  testsPass,
  ...(rule ? { rule } : {}),
});

const allow = (evidence: string): MatrixCell => cell('allow', evidence, true);
const deny = (evidence: string): MatrixCell => cell('deny', evidence, true);
const cond = (rule: string, evidence: string, testsPass = true): MatrixCell =>
  cell('conditional', evidence, testsPass, rule);

type RoleMatrix = Record<Role, MatrixCell>;
const M: Record<string, RoleMatrix> = {
  'article.read': {
    viewer: allow('src/policies/article.ts:12'),
    editor: allow('src/policies/article.ts:12'),
    maintainer: allow('src/policies/article.ts:12'),
    admin: allow('src/policies/article.ts:12'),
    superadmin: allow('src/policies/article.ts:12'),
  },
  'article.write': {
    viewer: deny('src/policies/article.ts:33'),
    editor: cond('own resource only', 'src/policies/article.ts:38'),
    maintainer: allow('src/policies/article.ts:42'),
    admin: allow('src/policies/article.ts:42'),
    superadmin: allow('src/policies/article.ts:42'),
  },
  'article.publish': {
    viewer: deny('src/policies/article.ts:55'),
    editor: deny('src/policies/article.ts:55'),
    maintainer: cond('non-featured only', 'src/policies/article.ts:60', false),
    admin: allow('src/policies/article.ts:65'),
    superadmin: allow('src/policies/article.ts:65'),
  },
  'article.delete': {
    viewer: deny('src/policies/article.ts:78'),
    editor: deny('src/policies/article.ts:78'),
    maintainer: cond('within 24h of creation', 'src/policies/article.ts:82'),
    admin: allow('src/policies/article.ts:90'),
    superadmin: allow('src/policies/article.ts:90'),
  },
  'asset.upload': {
    viewer: deny('src/policies/asset.ts:14'),
    editor: cond('< 10mb / file', 'src/policies/asset.ts:18'),
    maintainer: allow('src/policies/asset.ts:24'),
    admin: allow('src/policies/asset.ts:24'),
    superadmin: allow('src/policies/asset.ts:24'),
  },
  'asset.delete': {
    viewer: deny('src/policies/asset.ts:35'),
    editor: deny('src/policies/asset.ts:35'),
    maintainer: cond('not referenced', 'src/policies/asset.ts:42'),
    admin: allow('src/policies/asset.ts:50'),
    superadmin: allow('src/policies/asset.ts:50'),
  },
  'comment.moderate': {
    viewer: deny('src/policies/comment.ts:11'),
    editor: cond('own articles only', 'src/policies/comment.ts:18'),
    maintainer: allow('src/policies/comment.ts:24'),
    admin: allow('src/policies/comment.ts:24'),
    superadmin: allow('src/policies/comment.ts:24'),
  },
  'settings.read': {
    viewer: deny('src/policies/settings.ts:9'),
    editor: allow('src/policies/settings.ts:14'),
    maintainer: allow('src/policies/settings.ts:14'),
    admin: allow('src/policies/settings.ts:14'),
    superadmin: allow('src/policies/settings.ts:14'),
  },
  'settings.write': {
    viewer: deny('src/policies/settings.ts:22'),
    editor: deny('src/policies/settings.ts:22'),
    maintainer: deny('src/policies/settings.ts:22'),
    admin: allow('src/policies/settings.ts:30'),
    superadmin: allow('src/policies/settings.ts:30'),
  },
  'theme.write': {
    viewer: deny('src/policies/theme.ts:7'),
    editor: deny('src/policies/theme.ts:7'),
    maintainer: cond('staging only', 'src/policies/theme.ts:14', false),
    admin: allow('src/policies/theme.ts:22'),
    superadmin: allow('src/policies/theme.ts:22'),
  },
  'billing.read': {
    viewer: deny('src/policies/billing.ts:8'),
    editor: deny('src/policies/billing.ts:8'),
    maintainer: deny('src/policies/billing.ts:8'),
    admin: allow('src/policies/billing.ts:16'),
    superadmin: allow('src/policies/billing.ts:16'),
  },
  'billing.write': {
    viewer: deny('src/policies/billing.ts:24'),
    editor: deny('src/policies/billing.ts:24'),
    maintainer: deny('src/policies/billing.ts:24'),
    admin: cond('owner only', 'src/policies/billing.ts:32'),
    superadmin: allow('src/policies/billing.ts:40'),
  },
  'plan.change': {
    viewer: deny('src/policies/billing.ts:48'),
    editor: deny('src/policies/billing.ts:48'),
    maintainer: deny('src/policies/billing.ts:48'),
    admin: cond('within window', 'src/policies/billing.ts:55'),
    superadmin: allow('src/policies/billing.ts:60'),
  },
  'user.invite': {
    viewer: deny('src/policies/user.ts:9'),
    editor: deny('src/policies/user.ts:9'),
    maintainer: cond('seats remaining', 'src/policies/user.ts:18'),
    admin: allow('src/policies/user.ts:25'),
    superadmin: allow('src/policies/user.ts:25'),
  },
  'user.manage': {
    viewer: deny('src/policies/user.ts:35'),
    editor: deny('src/policies/user.ts:35'),
    maintainer: deny('src/policies/user.ts:35'),
    admin: cond('lower role only', 'src/policies/user.ts:42'),
    superadmin: allow('src/policies/user.ts:50'),
  },
  'apikeys.manage': {
    viewer: deny('src/policies/apikeys.ts:11'),
    editor: deny('src/policies/apikeys.ts:11'),
    maintainer: deny('src/policies/apikeys.ts:11'),
    admin: allow('src/policies/apikeys.ts:18'),
    superadmin: allow('src/policies/apikeys.ts:18'),
  },
  'webhooks.manage': {
    viewer: deny('src/policies/webhooks.ts:9'),
    editor: deny('src/policies/webhooks.ts:9'),
    maintainer: cond('non-prod only', 'src/policies/webhooks.ts:14'),
    admin: allow('src/policies/webhooks.ts:22'),
    superadmin: allow('src/policies/webhooks.ts:22'),
  },
  'audit.read': {
    viewer: deny('src/policies/audit.ts:8'),
    editor: deny('src/policies/audit.ts:8'),
    maintainer: deny('src/policies/audit.ts:8'),
    admin: cond('last 30d only', 'src/policies/audit.ts:15'),
    superadmin: allow('src/policies/audit.ts:24'),
  },
};

export function getCell(permId: string, role: Role): MatrixCell | undefined {
  const row = M[permId];
  if (!row) return undefined;
  return row[role];
}

export function statusFill(status: CellStatus): string {
  switch (status) {
    case 'allow':
      return 'fill-sem-static-soft';
    case 'conditional':
      return 'fill-sev-warn-soft';
    case 'deny':
      return 'fill-sev-err-soft';
  }
}

export function statusStroke(status: CellStatus): string {
  switch (status) {
    case 'allow':
      return 'stroke-sem-static';
    case 'conditional':
      return 'stroke-sev-warn';
    case 'deny':
      return 'stroke-sev-err';
  }
}

export function statusTone(status: CellStatus): 'static' | 'warn' | 'err' {
  switch (status) {
    case 'allow':
      return 'static';
    case 'conditional':
      return 'warn';
    case 'deny':
      return 'err';
  }
}

export function statusGlyph(status: CellStatus): string {
  switch (status) {
    case 'allow':
      return '✓';
    case 'conditional':
      return '~';
    case 'deny':
      return '✗';
  }
}

export const PERM_GROUPS: ReadonlyArray<PermGroup> = [
  'Content',
  'Settings',
  'Billing',
  'Admin',
];

export function roleSummary(role: Role): { allowed: number; total: number } {
  let allowed = 0;
  for (const p of PERMISSIONS) {
    const c = getCell(p.id, role);
    if (c?.status === 'allow') allowed++;
  }
  return { allowed, total: PERMISSIONS.length };
}
