/**
 * Monaco hover provider for JSX prop names — delegates to the
 * Props Origin scanner and renders the chain as markdown.
 */

import type { Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor, languages, IDisposable } from 'monaco-editor';
import { scanPropOrigin } from './scanner';
import type { PropChainStep, PropOrigin } from './types';

const RISK_BADGE: Record<PropOrigin['serializationRisk'], string> = {
  safe: '`safe`',
  maybe: '`maybe`',
  unsafe: '**unsafe**',
};

const KIND_LABEL: Record<PropChainStep['kind'], string> = {
  literal: 'literal',
  'parent-prop': 'parent prop',
  local: 'local var',
  hook: 'hook',
  import: 'import',
  'server-data': 'server data',
  unknown: 'unknown',
};

function chainToMarkdown(origin: PropOrigin): string {
  const lines: string[] = [];
  lines.push(`**Prop:** \`${origin.propName}\` on \`${origin.consumer}\``);
  lines.push('');
  lines.push(`**Risk:** ${RISK_BADGE[origin.serializationRisk]}${origin.serializationReason ? ` — ${origin.serializationReason}` : ''}`);
  lines.push('');
  lines.push('**Origin chain:**');
  origin.chain.forEach((step, i) => {
    lines.push(
      `${i + 1}. _${KIND_LABEL[step.kind]}_ — \`${step.snippet.replace(/`/g, '\\`')}\``,
    );
  });
  return lines.join('\n');
}

function modelPath(model: MonacoEditor.ITextModel): string {
  return decodeURIComponent(model.uri.path);
}

/**
 * Register a hover provider that activates ON JSX attribute names. We
 * gate by checking the word's surrounding line; the Monaco language
 * service would otherwise call us for every TypeScript hover.
 */
export function registerPropOriginHover(monaco: Monaco): IDisposable {
  return monaco.languages.registerHoverProvider(['typescript', 'javascript'], {
    provideHover: async (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const lineText = model.getLineContent(position.lineNumber);
      // Cheap pre-filter: must look like a JSX attribute (`name=` after the
      // word). Avoids calling ts-morph on every TS hover.
      const after = lineText.slice(word.endColumn - 1).trimStart();
      if (!after.startsWith('=') && !after.startsWith('/') && !after.startsWith('>') && !after.startsWith(' ')) {
        return null;
      }
      const file = modelPath(model);
      const source = model.getValue();
      let origin: PropOrigin | null;
      try {
        origin = await scanPropOrigin({
          file,
          source,
          line: position.lineNumber,
          column: word.startColumn,
        });
      } catch {
        return null;
      }
      if (!origin) return null;
      return {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        } satisfies languages.IRange,
        contents: [{ value: chainToMarkdown(origin) }],
      };
    },
  });
}
