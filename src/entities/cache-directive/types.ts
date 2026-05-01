// Re-exported analyzer types so feature code never has to reach into
// `@shared/analyzer` directly.
export type {
  UseCacheFinding,
  UseCacheKind,
  UseCacheScope,
  UseCacheReport,
  UseCacheInputFile,
} from '@shared/analyzer/use-cache';
