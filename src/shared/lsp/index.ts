export { lspClient, type LspClient } from './client';
export { useLspStore, selectAllDiagnostics, type LspState, type LspDiagnosticBucket, type LspDiagnosticKind } from './store';
export type {
  TsLocation,
  TsTextSpan,
  TsFileSpan,
  TsDiagnostic,
  TsDiagEvent,
  TsCompletionEntry,
  TsCompletionInfo,
  TsQuickInfo,
  TsRenameInfo,
  TsReferencesResponse,
  TsReferencesResponseItem,
  TsResponse,
  TsAnyMessage,
} from './types';
