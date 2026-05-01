/**
 * Safe Refactor Planner — types.
 *
 * Operations supported: rename, move, extract. Each operation produces a
 * `RefactorPlan` containing concrete steps, the affected files, the risk
 * assessment, and the tests we recommend running before/after applying.
 */

import type { AdmissionVerdict } from '@entities/evidence';

export type RefactorOperationKind = 'rename' | 'move' | 'extract';

export interface RenameOperation {
  kind: 'rename';
  /** File the symbol lives in. */
  file: string;
  /** 1-based line/column of the symbol's def site. */
  line: number;
  column: number;
  oldName: string;
  newName: string;
}

export interface MoveOperation {
  kind: 'move';
  fromFile: string;
  toFile: string;
  /** Optional: just one symbol to move; otherwise the whole file. */
  symbol?: string;
}

export interface ExtractOperation {
  kind: 'extract';
  file: string;
  /** Range of source to extract (1-based inclusive lines). */
  startLine: number;
  endLine: number;
  newName: string;
  /** Where to put the extracted unit. */
  target: 'same-file' | 'new-file';
  newFile?: string;
}

export type RefactorOperation = RenameOperation | MoveOperation | ExtractOperation;

export type RefactorRisk = 'low' | 'medium' | 'high';

export interface RefactorStep {
  id: string;
  description: string;
  /** File path the step touches (if any). */
  file?: string;
  /** Optional preview of the patch this step would apply. */
  patchPreview?: string;
}

export interface RefactorPlan {
  id: string;
  operation: RefactorOperation;
  steps: RefactorStep[];
  affectedFiles: string[];
  risks: { level: RefactorRisk; reason: string }[];
  requiredTests: string[];
  /** Unified diff for the proposed change — fed to the admission gate. */
  diff: string;
}

export type WizardStep = 'pick-op' | 'review-plan' | 'admission' | 'execute';

export interface ExecutionResult {
  ok: boolean;
  applied: string[];
  errors: string[];
}

export interface SafeRefactorState {
  plan: RefactorPlan | null;
  verdict: AdmissionVerdict | null;
  step: WizardStep;
  executing: boolean;
  result: ExecutionResult | null;
}
