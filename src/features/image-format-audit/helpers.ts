import { mockImages } from '@shared/mocks/images';
import type { ImageEntry, ImageFmt } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/image-format-audit/helpers` consumers keep working.
export type { ImageEntry, ImageFmt } from '@shared/types';

export const images: ReadonlyArray<ImageEntry> = mockImages;

export const FORMAT_LABEL: Record<ImageFmt, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  svg: 'SVG',
  gif: 'GIF',
};

export const FORMAT_TONE: Record<ImageFmt, 'muted' | 'warn' | 'static' | 'info' | 'err'> = {
  jpeg: 'warn',
  png: 'warn',
  webp: 'info',
  avif: 'static',
  svg: 'muted',
  gif: 'err',
};

export function totalSavings(entries: ReadonlyArray<ImageEntry>): number {
  return entries.reduce((sum, e) => sum + e.estSavingsKb, 0);
}
