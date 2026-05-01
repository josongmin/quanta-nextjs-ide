import type { FrameKind } from '../helpers';

export function kindFill(kind: FrameKind, dim: boolean): string {
  if (dim) return 'fill-line/40';
  switch (kind) {
    case 'react':
      return 'fill-sem-static-soft';
    case 'app':
      return 'fill-accent-soft';
    case 'lib':
      return 'fill-sev-info-soft';
    case 'browser':
      return 'fill-sev-warn-soft';
    case 'gc':
      return 'fill-sev-err-soft';
  }
}

export function kindStroke(kind: FrameKind, dim: boolean): string {
  if (dim) return 'stroke-line';
  switch (kind) {
    case 'react':
      return 'stroke-sem-static';
    case 'app':
      return 'stroke-accent';
    case 'lib':
      return 'stroke-sev-info';
    case 'browser':
      return 'stroke-sev-warn';
    case 'gc':
      return 'stroke-sev-err';
  }
}

export function kindTone(
  kind: FrameKind,
): 'static' | 'accent' | 'info' | 'warn' | 'err' {
  switch (kind) {
    case 'react':
      return 'static';
    case 'app':
      return 'accent';
    case 'lib':
      return 'info';
    case 'browser':
      return 'warn';
    case 'gc':
      return 'err';
  }
}

export const ROW_H = 18;
export const SVG_W = 800;
