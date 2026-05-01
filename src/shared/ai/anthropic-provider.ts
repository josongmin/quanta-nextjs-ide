import type {
  AiCompleteRequest,
  AiCompleteResponse,
  AiProvider,
} from './types';

/**
 * Anthropic Claude provider — direct browser fetch.
 *
 * Caveat: in a browser context the API key lives in the user's localStorage
 * and is sent in the Authorization header. This is acceptable for a local
 * developer tool but would not be acceptable for a multi-tenant web app.
 * Tauri build will move this to the backend over IPC.
 */
export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic';
  readonly label = 'Anthropic Claude';

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'claude-sonnet-4-6',
  ) {}

  async complete(req: AiCompleteRequest): Promise<AiCompleteResponse> {
    const systemMessages = req.messages.filter((m) => m.role === 'system');
    const turn = req.messages.filter((m) => m.role !== 'system');

    const contextBlock = serializeContext(req.context);
    const system = [
      systemMessages.map((m) => m.content).join('\n\n'),
      contextBlock,
    ]
      .filter(Boolean)
      .join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages: turn.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '(no body)');
      throw new Error(`Anthropic ${res.status}: ${text}`);
    }
    const json = (await res.json()) as {
      content?: ReadonlyArray<{ type: string; text?: string }>;
    };
    const text =
      json.content?.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n') ??
      '';

    return { text, provider: this.id, stub: false };
  }

  async *streamComplete(req: AiCompleteRequest): AsyncIterable<string> {
    const systemMessages = req.messages.filter((m) => m.role === 'system');
    const turn = req.messages.filter((m) => m.role !== 'system');
    const contextBlock = serializeContext(req.context);
    const system = [
      systemMessages.map((m) => m.content).join('\n\n'),
      contextBlock,
    ]
      .filter(Boolean)
      .join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        stream: true,
        system,
        messages: turn.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Anthropic ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const ev of events) {
        const dataLine = ev.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;
        try {
          const json = JSON.parse(dataLine.slice(5).trim()) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
          /* ignore non-JSON heartbeat */
        }
      }
    }
  }
}

function serializeContext(ctx: AiCompleteRequest['context']): string {
  if (!ctx) return '';
  const out: string[] = [];
  if (ctx.probeSummary) {
    out.push('## Probe (RSC runtime) context');
    out.push(ctx.probeSummary);
  }
  if (ctx.astSummary) {
    out.push('## AST (static) context');
    out.push(ctx.astSummary);
  }
  if (ctx.sources?.length) {
    out.push('## Source snippets');
    for (const s of ctx.sources) {
      out.push(`### ${s.file}\n\`\`\`\n${s.snippet}\n\`\`\``);
    }
  }
  return out.join('\n\n');
}
