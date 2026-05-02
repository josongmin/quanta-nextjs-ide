/**
 * `<CauseGlyphsLegend>` — small floating pill row rendered in the editor's
 * bottom-right corner. Clicking a kind filters the editor (others fade);
 * clicking the active kind clears the filter. The "all" toggle reveals
 * low-confidence glyphs.
 */

import { ALL_KINDS, KIND_TO_LABEL } from './color-map';
import type { CauseKind } from './types';
import type { UseCauseGlyphsResult } from './hook';
import './styles.css';

interface Props {
  result: UseCauseGlyphsResult;
  className?: string;
}

const CSS_VAR_BY_KIND: Record<CauseKind, string> = {
  'static-safe': 'var(--sem-static)',
  'dynamic-trigger': 'var(--sem-dynamic)',
  'cache-mutation': 'var(--accent)',
  'client-leak-source': 'var(--sem-client)',
  'secret-flow': 'var(--err)',
};

export function CauseGlyphsLegend({ result, className }: Props) {
  const { countsByKind, filter, setActiveKind, toggleShowLowConfidence } = result;

  const total = ALL_KINDS.reduce((acc, k) => acc + countsByKind[k], 0);
  if (total === 0 && !filter.showLowConfidence) {
    // Hide entirely on clean files unless user opted into "show all".
    return null;
  }

  return (
    <div
      className={['cg-legend', className].filter(Boolean).join(' ')}
      role="toolbar"
      aria-label="Cause glyphs legend"
    >
      {ALL_KINDS.map((kind) => {
        const count = countsByKind[kind];
        const isActive = filter.activeKind === kind;
        return (
          <button
            type="button"
            key={kind}
            className="cg-legend__pill"
            data-active={isActive}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ ['--cg-color' as string]: CSS_VAR_BY_KIND[kind] }}
            onClick={() => setActiveKind(isActive ? null : kind)}
            title={KIND_TO_LABEL[kind]}
          >
            <span className="cg-legend__swatch" aria-hidden="true" />
            <span>{KIND_TO_LABEL[kind]}</span>
            <span className="cg-legend__count">{count}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="cg-legend__toggle"
        data-on={filter.showLowConfidence}
        onClick={toggleShowLowConfidence}
        title="Show low-confidence glyphs"
      >
        all
      </button>
    </div>
  );
}
