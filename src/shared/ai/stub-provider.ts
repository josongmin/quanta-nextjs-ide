import type {
  AiCompleteRequest,
  AiCompleteResponse,
  AiProvider,
} from './types';

/**
 * Deterministic AI provider that returns context-aware canned responses.
 *
 * Used as the default so the AI panel works out-of-the-box without a
 * real API key, and so e2e tests can assert on stable text.
 */
export class StubProvider implements AiProvider {
  readonly id = 'stub';
  readonly label = 'Stub (no network)';

  async complete(req: AiCompleteRequest): Promise<AiCompleteResponse> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const q = lastUser?.content.toLowerCase() ?? '';
    const ctx = req.context;

    const lines: string[] = [];
    lines.push('**Stub AI** — no real LLM call. Connect an API key to upgrade.');
    lines.push('');

    if (ctx?.probeSummary) {
      lines.push('### Probe context');
      lines.push(ctx.probeSummary);
      lines.push('');
    }
    if (ctx?.astSummary) {
      lines.push('### AST context');
      lines.push(ctx.astSummary);
      lines.push('');
    }

    if (q.includes('client') && q.includes('bundle')) {
      lines.push('### Suggestion');
      lines.push(
        'Look at the user-authored `\'use client\'` modules in the Quality tab — those are the leaks worth fixing first. Server-only data fetches inside a client component force the boundary up.',
      );
    } else if (q.includes('suspense')) {
      lines.push('### Suggestion');
      lines.push(
        'Open the Boundaries view in the RSC overlay. Each Suspense bar shows fallback duration; the longest ones are candidates for parallel data fetching.',
      );
    } else if (q.includes('cache') || q.includes('revalidate')) {
      lines.push('### Suggestion');
      lines.push(
        'Re-fetch the same URL twice and open the Diff view. Chunks marked `changed` are revalidated; `unchanged` were served from cache.',
      );
    } else if (q.length > 0) {
      lines.push('### Echo');
      lines.push(`> ${lastUser?.content ?? ''}`);
      lines.push('');
      lines.push(
        'I would normally answer with Probe + AST context above. Plug in an Anthropic API key in settings to get real answers.',
      );
    } else {
      lines.push('Ask me a question about your Next.js app.');
    }

    return {
      text: lines.join('\n'),
      provider: this.id,
      stub: true,
    };
  }
}
