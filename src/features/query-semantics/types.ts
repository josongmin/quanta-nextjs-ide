import type { RuleId } from '@shared/types';

export type QuerySmellKind =
  | 'n+1'
  | 'no-pagination'
  | 'no-transaction'
  | 'heavy-include'
  | 'select-star';

export type QuerySmellSeverity = 'low' | 'medium' | 'high';

export interface QuerySmell {
  id: string;
  kind: QuerySmellKind;
  file: string;
  line: number;
  endLine?: number;
  severity: QuerySmellSeverity;
  title: string;
  message: string;
  snippet: string;
  suggestion: string;
  routeId?: string;
}

export const SMELL_RULE_ID: Record<QuerySmellKind, RuleId> = {
  'n+1': 'db-n-plus-one',
  'no-pagination': 'db-unbounded-query',
  'no-transaction': 'db-no-transaction',
  'heavy-include': 'db-large-result',
  'select-star': 'db-select-star',
};

export const SMELL_LABEL: Record<QuerySmellKind, string> = {
  'n+1': 'N+1 Query',
  'no-pagination': 'Missing Pagination',
  'no-transaction': 'Missing Transaction',
  'heavy-include': 'Heavy Include',
  'select-star': 'Select All',
};
