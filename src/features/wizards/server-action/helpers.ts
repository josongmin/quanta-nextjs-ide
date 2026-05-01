export type ServerActionAuth = 'none' | 'requireUser' | 'requireRole';
export type ServerActionMutation = 'create' | 'update' | 'delete' | 'custom';

export interface ServerActionConfig {
  name: string;
  routeId: string | null;
  auth: ServerActionAuth;
  role: string;
  mutation: ServerActionMutation;
  schema: string;
  revalidateTags: string[];
  idempotent: boolean;
  audit: boolean;
  transaction: boolean;
}

export function defaultConfig(): ServerActionConfig {
  return {
    name: 'updateProduct',
    routeId: null,
    auth: 'requireUser',
    role: 'admin',
    mutation: 'update',
    schema: defaultSchema('update'),
    revalidateTags: [],
    idempotent: false,
    audit: true,
    transaction: false,
  };
}

export function defaultSchema(mutation: ServerActionMutation): string {
  switch (mutation) {
    case 'create':
      return [
        'const InputSchema = z.object({',
        '  name: z.string().min(1).max(140),',
        '  price: z.number().int().nonnegative(),',
        '  description: z.string().optional(),',
        '});',
      ].join('\n');
    case 'update':
      return [
        'const InputSchema = z.object({',
        '  id: z.string().uuid(),',
        '  name: z.string().min(1).max(140).optional(),',
        '  price: z.number().int().nonnegative().optional(),',
        '});',
      ].join('\n');
    case 'delete':
      return [
        'const InputSchema = z.object({',
        '  id: z.string().uuid(),',
        '});',
      ].join('\n');
    case 'custom':
    default:
      return [
        'const InputSchema = z.object({',
        '  // Define inputs here',
        '});',
      ].join('\n');
  }
}

function camelToPascal(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function safeName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_]/g, '');
  if (cleaned.length === 0) return 'doMutation';
  if (/^[0-9]/.test(cleaned)) return `_${cleaned}`;
  return cleaned;
}

export function generateServerAction(c: ServerActionConfig): string {
  const fnName = safeName(c.name);
  const ResultName = `${camelToPascal(fnName)}Result`;
  const InputName = `${camelToPascal(fnName)}Input`;

  const lines: string[] = [];
  lines.push(`'use server';`);
  lines.push('');
  lines.push(`import { z } from 'zod';`);
  lines.push(`import { revalidateTag } from 'next/cache';`);
  if (c.auth !== 'none') {
    lines.push(`import { getSession } from '@/lib/auth';`);
  }
  if (c.audit) {
    lines.push(`import { auditLog } from '@/lib/audit';`);
  }
  if (c.transaction) {
    lines.push(`import { db } from '@/lib/db';`);
  } else {
    lines.push(`import * as repo from '@/lib/repo';`);
  }
  if (c.idempotent) {
    lines.push(`import { ensureIdempotent } from '@/lib/idempotency';`);
  }
  lines.push('');
  lines.push(c.schema.trim());
  lines.push('');
  lines.push(`export type ${InputName} = z.infer<typeof InputSchema>;`);
  lines.push('');
  lines.push(`export type ${ResultName} =`);
  lines.push(`  | { ok: true; data: { id: string } }`);
  lines.push(`  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };`);
  lines.push('');

  const params = c.idempotent
    ? `input: ${InputName}, opts: { idempotencyKey: string }`
    : `input: ${InputName}`;
  lines.push(`export async function ${fnName}(${params}): Promise<${ResultName}> {`);
  lines.push(`  const parsed = InputSchema.safeParse(input);`);
  lines.push(`  if (!parsed.success) {`);
  lines.push(`    return {`);
  lines.push(`      ok: false,`);
  lines.push(`      error: {`);
  lines.push(`        code: 'INVALID_INPUT',`);
  lines.push(`        message: 'Validation failed',`);
  lines.push(`        fields: parsed.error.flatten().fieldErrors as Record<string, string>,`);
  lines.push(`      },`);
  lines.push(`    };`);
  lines.push(`  }`);
  lines.push('');

  if (c.auth !== 'none') {
    lines.push(`  const session = await getSession();`);
    lines.push(`  if (!session?.user) {`);
    lines.push(`    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Sign-in required' } };`);
    lines.push(`  }`);
    if (c.auth === 'requireRole') {
      const role = c.role.trim().length > 0 ? c.role.trim() : 'admin';
      lines.push(`  if (session.user.role !== ${JSON.stringify(role)}) {`);
      lines.push(`    return { ok: false, error: { code: 'FORBIDDEN', message: 'Role ${role} required' } };`);
      lines.push(`  }`);
    }
    lines.push('');
  }

  if (c.idempotent) {
    lines.push(`  const cached = await ensureIdempotent(opts.idempotencyKey);`);
    lines.push(`  if (cached) return cached as ${ResultName};`);
    lines.push('');
  }

  lines.push(`  try {`);
  if (c.transaction) {
    lines.push(`    const data = await db.$transaction(async (tx) => {`);
    lines.push(`      ${mutationBody(c.mutation, '      ', 'tx')}`);
    lines.push(`    });`);
  } else {
    lines.push(`    ${mutationBody(c.mutation, '    ', 'repo')}`);
  }
  lines.push('');
  for (const tag of c.revalidateTags) {
    lines.push(`    revalidateTag(${JSON.stringify(tag)});`);
  }
  if (c.audit) {
    lines.push(
      `    await auditLog({ action: ${JSON.stringify(fnName)}, actor: ${
        c.auth === 'none' ? 'null' : 'session.user.id'
      }, payload: parsed.data });`,
    );
  }
  lines.push('');
  lines.push(`    return { ok: true, data: { id: 'id' in parsed.data ? parsed.data.id : data.id } };`);
  lines.push(`  } catch (err) {`);
  lines.push(`    console.error(${JSON.stringify(`[${fnName}]`)}, err);`);
  lines.push(`    return { ok: false, error: { code: 'INTERNAL', message: 'Unexpected error' } };`);
  lines.push(`  }`);
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function mutationBody(
  mutation: ServerActionMutation,
  indent: string,
  client: string,
): string {
  switch (mutation) {
    case 'create':
      return `const data = await ${client}.product.create({ data: parsed.data });`;
    case 'update':
      return `const data = await ${client}.product.update({ where: { id: parsed.data.id }, data: parsed.data });`;
    case 'delete':
      return `const data = await ${client}.product.delete({ where: { id: parsed.data.id } });`;
    case 'custom':
    default:
      return [
        `// TODO: implement mutation`,
        `${indent}const data = { id: 'placeholder' };`,
      ].join('\n');
  }
}
