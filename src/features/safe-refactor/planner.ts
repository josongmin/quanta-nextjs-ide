/**
 * Safe Refactor planner.
 *
 * Translates a high-level operation (rename / move / extract) into a
 * concrete `RefactorPlan` with steps, affected files, risk notes, and a
 * unified diff that downstream code (admission gate, executor) consumes.
 *
 * For rename, we leverage `lspClient.rename` (Phase 2) when the editor
 * is running in a Tauri context. In a pure-web/test context we fall
 * back to a heuristic plan that captures the user's intent without
 * actually touching files.
 */

import { lspClient } from '@shared/lsp';
import type {
  ExtractOperation,
  MoveOperation,
  RefactorOperation,
  RefactorPlan,
  RefactorStep,
  RenameOperation,
} from './types';

let planCounter = 0;

function planId(): string {
  return `plan_${++planCounter}_${Date.now().toString(36)}`;
}

function stepId(prefix: string, n: number): string {
  return `${prefix}_${n}`;
}

async function planRename(op: RenameOperation): Promise<RefactorPlan> {
  const steps: RefactorStep[] = [];
  const affected = new Set<string>([op.file]);

  // Try LSP first — it gives us a precise list of locations to update.
  let locations: { file: string; line: number; offset: number }[] = [];
  try {
    if (lspClient.isStarted()) {
      const info = await lspClient.rename(op.file, op.line, op.column, op.newName);
      const locs = info?.locs ?? [];
      for (const loc of locs) {
        const f = loc.file;
        affected.add(f);
        for (const span of loc.locs ?? []) {
          locations.push({ file: f, line: span.start.line, offset: span.start.offset });
        }
      }
    }
  } catch {
    // Best-effort: fall through to heuristic.
  }

  if (locations.length) {
    locations.forEach((loc, i) => {
      steps.push({
        id: stepId('rename', i),
        description: `Replace \`${op.oldName}\` → \`${op.newName}\` at ${loc.file}:${loc.line}`,
        file: loc.file,
      });
    });
  } else {
    steps.push({
      id: stepId('rename', 0),
      description: `Rename ${op.oldName} → ${op.newName} in ${op.file}`,
      file: op.file,
    });
    steps.push({
      id: stepId('rename', 1),
      description: 'Update all import statements that reference the renamed symbol.',
    });
  }

  const risks: RefactorPlan['risks'] = [];
  if (op.oldName === op.newName) {
    risks.push({ level: 'high', reason: 'Old and new name are identical.' });
  }
  if (/[A-Z]/.test(op.oldName[0] ?? '') !== /[A-Z]/.test(op.newName[0] ?? '')) {
    risks.push({
      level: 'medium',
      reason: 'Casing change — may affect React component vs. function disambiguation.',
    });
  }
  if (!locations.length) {
    risks.push({
      level: 'medium',
      reason: 'LSP unavailable; rename plan is heuristic and may miss usages.',
    });
  }

  const diff = renameDiff(op);

  return {
    id: planId(),
    operation: op,
    steps,
    affectedFiles: [...affected],
    risks,
    requiredTests: [
      'Run unit tests for the symbol\'s home file',
      'Run integration tests for any route that imports the symbol',
    ],
    diff,
  };
}

function renameDiff(op: RenameOperation): string {
  return [
    `--- a/${op.file}`,
    `+++ b/${op.file}`,
    `@@ rename`,
    `-${op.oldName}`,
    `+${op.newName}`,
  ].join('\n');
}

function planMove(op: MoveOperation): RefactorPlan {
  const affected = new Set<string>([op.fromFile, op.toFile]);
  const steps: RefactorStep[] = [];
  let n = 0;

  if (op.symbol) {
    steps.push({
      id: stepId('move', n++),
      description: `Move symbol \`${op.symbol}\` from ${op.fromFile} to ${op.toFile}`,
      file: op.fromFile,
    });
  } else {
    steps.push({
      id: stepId('move', n++),
      description: `Move file ${op.fromFile} → ${op.toFile}`,
      file: op.fromFile,
    });
  }
  steps.push({
    id: stepId('move', n++),
    description: 'Rewrite import specifiers in every file that imports from the old path.',
  });
  steps.push({
    id: stepId('move', n++),
    description: 'Update tsconfig path aliases if the move crosses an alias boundary.',
  });

  const risks: RefactorPlan['risks'] = [];
  if (op.fromFile === op.toFile) {
    risks.push({ level: 'high', reason: 'Source and destination paths are identical.' });
  }
  if (op.toFile.includes('/__tests__/')) {
    risks.push({ level: 'medium', reason: 'Moving production code into a test directory.' });
  }
  if (op.fromFile.startsWith('src/shared/') && !op.toFile.startsWith('src/shared/')) {
    risks.push({
      level: 'medium',
      reason: 'Moving from `shared` may break the layer boundary; review with Layer Violation Detector.',
    });
  }

  const diff = [
    `--- a/${op.fromFile}`,
    `+++ /dev/null`,
    `@@ moved to ${op.toFile}`,
  ].join('\n');

  return {
    id: planId(),
    operation: op,
    steps,
    affectedFiles: [...affected],
    risks,
    requiredTests: [
      'Run the type checker (`tsc --noEmit`) to catch broken import paths',
      'Run any test suite that touches either path',
    ],
    diff,
  };
}

function planExtract(op: ExtractOperation): RefactorPlan {
  const affected = new Set<string>([op.file]);
  if (op.target === 'new-file' && op.newFile) affected.add(op.newFile);

  const steps: RefactorStep[] = [
    {
      id: stepId('extract', 0),
      description: `Extract lines ${op.startLine}-${op.endLine} into \`${op.newName}\``,
      file: op.file,
    },
    {
      id: stepId('extract', 1),
      description:
        op.target === 'new-file'
          ? `Create new file ${op.newFile ?? '(unspecified)'} and export ${op.newName}`
          : `Insert ${op.newName} above the original site`,
    },
    {
      id: stepId('extract', 2),
      description: `Replace original block with a call to ${op.newName}.`,
    },
  ];

  const risks: RefactorPlan['risks'] = [];
  if (op.endLine - op.startLine > 80) {
    risks.push({
      level: 'medium',
      reason: 'Extraction range is large — the extracted unit may need further decomposition.',
    });
  }
  if (op.target === 'new-file' && !op.newFile) {
    risks.push({ level: 'high', reason: 'Target is `new-file` but no path was given.' });
  }

  const diff = [
    `--- a/${op.file}`,
    `+++ b/${op.file}`,
    `@@ extract ${op.startLine}-${op.endLine} → ${op.newName}`,
  ].join('\n');

  return {
    id: planId(),
    operation: op,
    steps,
    affectedFiles: [...affected],
    risks,
    requiredTests: [
      'Verify behaviour via the existing tests for the source file',
      'Add a focused unit test for the extracted unit',
    ],
    diff,
  };
}

export async function planRefactor(operation: RefactorOperation): Promise<RefactorPlan> {
  switch (operation.kind) {
    case 'rename':
      return planRename(operation);
    case 'move':
      return planMove(operation);
    case 'extract':
      return planExtract(operation);
  }
}
