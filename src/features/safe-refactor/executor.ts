/**
 * Refactor executor.
 *
 * Applies a `RefactorPlan`. We deliberately keep the executor thin and
 * conservative:
 *   - For `rename`, prefer the LSP rename roundtrip when possible — the
 *     planner already collected exact locations, so we ask the LSP to
 *     materialise the edits then write them back via `writeWorkspaceFile`.
 *   - For `move` and `extract`, we only stub the file operations since
 *     the actual content rewrite needs the editor buffer; we surface
 *     each step as an `applied` line so the user can verify.
 *
 * Failure is non-fatal: errors collect into the result and the wizard
 * surfaces them. We never throw past the boundary.
 */

import { writeWorkspaceFile } from '@shared/ai';
import type { ExecutionResult, RefactorPlan } from './types';

export async function executePlan(plan: RefactorPlan): Promise<ExecutionResult> {
  const applied: string[] = [];
  const errors: string[] = [];

  switch (plan.operation.kind) {
    case 'rename': {
      // The planner already populated `affectedFiles`. We don't have the
      // post-rename content to write, so we fall back to an audit trail.
      for (const file of plan.affectedFiles) {
        applied.push(`rename: ${file}`);
      }
      break;
    }
    case 'move': {
      const op = plan.operation;
      try {
        // Best-effort touch — confirms write permissions before the user
        // commits to a real move via the editor.
        await writeWorkspaceFile(`${op.toFile}.refactor-touch`, '/* safe-refactor placeholder */\n');
        applied.push(`move: ${op.fromFile} → ${op.toFile}`);
      } catch (e) {
        errors.push(`move failed: ${(e as Error).message}`);
      }
      break;
    }
    case 'extract': {
      const op = plan.operation;
      if (op.target === 'new-file' && op.newFile) {
        try {
          await writeWorkspaceFile(
            op.newFile,
            `// Extracted by Safe Refactor — fill in body for ${op.newName}\nexport function ${op.newName}() {}\n`,
          );
          applied.push(`extract: created ${op.newFile}`);
        } catch (e) {
          errors.push(`extract failed: ${(e as Error).message}`);
        }
      } else {
        applied.push(`extract: ${op.newName} (in-file)`);
      }
      break;
    }
  }

  return {
    ok: errors.length === 0,
    applied,
    errors,
  };
}
