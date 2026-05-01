/**
 * Image-format-audit shape types.
 *
 * Lives in `shared/types` so the `image-format-audit` feature and the
 * `shared/mocks/images.ts` mock data can both reference these without
 * a shared-to-feature import.
 */

export type ImageFmt = 'jpeg' | 'png' | 'webp' | 'avif' | 'svg' | 'gif';

export interface ImageEntry {
  id: string;
  src: string;
  file: string;
  line: number;
  format: ImageFmt;
  recommendedFormat: ImageFmt;
  widthHint: number;
  lazy: boolean;
  hasSrcSet: boolean;
  estSavingsKb: number;
}
