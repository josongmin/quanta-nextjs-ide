/**
 * Minimal types mirroring tsserver's wire protocol (`typescript/lib/protocol.d.ts`).
 *
 * tsserver uses 1-based `line` and 1-based `offset` (column). Monaco uses 1-based
 * `lineNumber` and 1-based `column`. Both are 1-based so positions translate
 * directly EXCEPT that some tsserver replies use { line, character } for
 * positions inside `textChanges` etc. We only model what we consume.
 */

export type TsLocation = {
  line: number;
  offset: number;
};

export type TsTextSpan = {
  start: TsLocation;
  end: TsLocation;
};

export type TsFileSpan = TsTextSpan & {
  file: string;
};

export type TsDiagnostic = {
  start: TsLocation;
  end: TsLocation;
  text: string;
  code?: number;
  category: 'error' | 'warning' | 'suggestion' | 'message';
  source?: string;
};

export type TsDiagEvent = {
  type: 'event';
  event: 'semanticDiag' | 'syntaxDiag' | 'suggestionDiag';
  body: {
    file: string;
    diagnostics: TsDiagnostic[];
  };
};

export type TsCompletionEntry = {
  name: string;
  kind: string;
  kindModifiers?: string;
  sortText?: string;
  insertText?: string;
  replacementSpan?: TsTextSpan;
  hasAction?: boolean;
  source?: string;
  isRecommended?: boolean;
};

export type TsCompletionInfo = {
  isGlobalCompletion: boolean;
  isMemberCompletion: boolean;
  isNewIdentifierLocation: boolean;
  entries: TsCompletionEntry[];
};

export type TsQuickInfo = {
  kind: string;
  kindModifiers: string;
  start: TsLocation;
  end: TsLocation;
  displayString: string;
  documentation?: string | Array<{ kind: string; text: string }>;
  tags?: Array<{ name: string; text?: string | Array<{ kind: string; text: string }> }>;
};

export type TsRenameInfo = {
  info:
    | {
        canRename: true;
        displayName: string;
        fullDisplayName: string;
        kind: string;
        kindModifiers: string;
        triggerSpan: TsTextSpan;
      }
    | {
        canRename: false;
        localizedErrorMessage: string;
      };
  locs: Array<{
    file: string;
    locs: Array<TsTextSpan & { prefixText?: string; suffixText?: string }>;
  }>;
};

export type TsReferencesResponseItem = TsFileSpan & {
  isWriteAccess: boolean;
  isDefinition: boolean;
  lineText?: string;
};

export type TsReferencesResponse = {
  refs: TsReferencesResponseItem[];
  symbolName: string;
  symbolStartOffset: number;
  symbolDisplayString: string;
};

export type TsResponse<TBody = unknown> = {
  type: 'response';
  seq: number;
  request_seq: number;
  command: string;
  success: boolean;
  message?: string;
  body?: TBody;
};

export type TsAnyMessage = {
  type: string;
  [k: string]: unknown;
};
