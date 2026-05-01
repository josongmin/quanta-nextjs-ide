import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  Icon,
  Inspector,
  Kbd,
  Section,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  code?: { lang: string; body: string };
  evidence?: string[];
}

const SUGGESTED_PROMPTS = [
  'Why is this route dynamic?',
  'Suggest a fix for the highest-severity issue',
  'Generate idempotent createOrder',
  'Review this server action',
  'Explain the cache lineage',
  'Identify hydration risks',
] as const;

type ModelId = 'haiku' | 'sonnet' | 'opus';

const MODELS: Record<
  ModelId,
  { label: string; latency: string }
> = {
  haiku: { label: 'claude-haiku', latency: '~80ms' },
  sonnet: { label: 'claude-sonnet', latency: '~400ms' },
  opus: { label: 'claude-opus', latency: '~1.2s' },
};

function generateMockAiResponse(
  prompt: string,
  ctx: { route: string; file: string; diagCount: number },
): Message {
  const lower = prompt.toLowerCase();
  if (lower.includes('dynamic') || lower.includes('why')) {
    return {
      id: `m_${Date.now()}`,
      role: 'ai',
      text: `${ctx.route} is currently classified as dynamic because **cookies()** is invoked transitively via getSession(). The trigger lives in lib/auth.ts:6 and propagates through layout.tsx, affecting 12 routes including this one. The cleanest fix is to confine the auth read to a client island that wraps just the user-specific UI.`,
      evidence: ['lib/auth.ts:6', 'app/(shop)/layout.tsx:8', '12 affected routes'],
      code: {
        lang: 'tsx',
        body: `// app/(shop)/layout.tsx — keep server-only\nexport default async function ShopLayout({ children }: { children: ReactNode }) {\n  return <AppShell>{children}</AppShell>\n}\n\n// components/UserMenu.client.tsx — opt into dynamic only here\n'use client'\nexport function UserMenu() {\n  const session = useSession()\n  // ...\n}`,
      },
    };
  }
  if (lower.includes('fix') || lower.includes('highest')) {
    return {
      id: `m_${Date.now()}`,
      role: 'ai',
      text: `The highest-severity issue in your current diff is the missing auth check on /admin/users/delete. The action mutates user records without requireUser/requireRole and was modified in commit a8f1c2. I recommend inserting **requireRole("admin")** at the top of the action body and a rollback PR for the change that removed it.`,
      evidence: ['app/admin/users/delete/actions.ts:12', 'commit a8f1c2'],
      code: {
        lang: 'ts',
        body: `'use server'\nimport { requireRole } from '@/lib/auth'\n\nexport async function deleteUser(formData: FormData) {\n  await requireRole('admin')              // ← insert\n  const id = String(formData.get('id'))\n  await db.user.delete({ where: { id } })\n  await audit({ kind: 'user.delete', id }) // ← also missing\n  return { ok: true }\n}`,
      },
    };
  }
  if (lower.includes('idempotent') || lower.includes('order')) {
    return {
      id: `m_${Date.now()}`,
      role: 'ai',
      text: `For createOrder, idempotency hinges on a stable client-supplied key. I'd recommend a hidden form input bound to a useId / crypto.randomUUID, then deduping in the service layer with a unique constraint on (user, idempotencyKey). Here's a sketch:`,
      code: {
        lang: 'ts',
        body: `'use server'\nexport async function createOrder(formData: FormData) {\n  const user = await requireUser()\n  const data = createOrderSchema.parse(Object.fromEntries(formData))\n  const order = await orders.upsertWithKey({\n    userId: user.id,\n    idempotencyKey: data.idempotencyKey,\n    payload: data,\n  })\n  revalidateTag('orders')\n  redirect('/orders/' + order.id)\n}`,
      },
    };
  }
  if (lower.includes('cache') || lower.includes('lineage')) {
    return {
      id: `m_${Date.now()}`,
      role: 'ai',
      text: `Your cache lineage is mostly healthy. Tag "products" has 4 producers and 1 invalidator (in updateProduct). The orphan I see is **reviews** — 1 producer and 0 invalidators. If reviews are mutable, you'll want a revalidateTag('reviews') in any mutation that touches them. Also worth noting: tags "Product" / "product" / "products" are in an inconsistencyGroup; consider a project-wide rename to canonical "products" + "product:{id}".`,
      evidence: ['products: 4P/1I', 'reviews: 1P/0I (orphan)', 'inconsistency: products'],
    };
  }
  return {
    id: `m_${Date.now()}`,
    role: 'ai',
    text: `Looking at ${ctx.route} (${ctx.file}). I see ${ctx.diagCount} diagnostic${ctx.diagCount === 1 ? '' : 's'} on this surface. Want me to walk through the highest-severity ones first?`,
  };
}

export function AiInspector() {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const cursor = useEditorStore((s) => s.cursor);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const file = cursor?.file ?? '—';
  const route = useMemo(
    () => routes.find((r) => r.files.page === file || r.files.layout === file),
    [routes, file],
  );
  const fileDiagCount = useMemo(
    () => diagnostics.filter((d) => d.location.file === file).length,
    [diagnostics, file],
  );

  const [model, setModel] = useState<ModelId>('sonnet');
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'seed_1',
      role: 'user',
      text: 'Why is this route dynamic?',
    },
    generateMockAiResponse('Why is this route dynamic?', {
      route: route?.path ?? '/',
      file,
      diagCount: fileDiagCount,
    }),
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming]);

  const send = (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: prompt,
    };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setStreaming(true);
    const ctx = {
      route: route?.path ?? '/',
      file,
      diagCount: fileDiagCount,
    };
    window.setTimeout(() => {
      setMessages((m) => [...m, generateMockAiResponse(prompt, ctx)]);
      setStreaming(false);
    }, 600 + Math.random() * 600);
  };

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">AI</span>
          <span className="font-mono text-sm text-ink-1">explain · suggest · review</span>
          <Chip tone="muted" size="xs">
            {MODELS[model].latency}
          </Chip>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          {messages.length} message{messages.length === 1 ? '' : 's'} ·{' '}
          <span className="text-ink-2">{MODELS[model].label}</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Context ------------------------------------------------------- */}
      <Section title="Context" defaultOpen>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Chip tone="muted" size="xs">
            <span className="font-mono">{file.split('/').pop() ?? file}</span>
          </Chip>
          {route ? (
            <Chip tone="isr" size="xs">
              <span className="font-mono">{route.path}</span>
            </Chip>
          ) : null}
          <Chip tone="warn" size="xs">
            {fileDiagCount} risks
          </Chip>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button size="xs" tone="soft" onClick={() => toast('Use this file as AI context')}>
            Use this file
          </Button>
          <Button size="xs" tone="soft" onClick={() => toast('Use this route as AI context')}>
            Use this route
          </Button>
          <Button size="xs" tone="soft" onClick={() => toast('Use selection as AI context')}>
            Use selection
          </Button>
        </div>
      </Section>

      {/* Conversation -------------------------------------------------- */}
      <Section title="Conversation" defaultOpen>
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {streaming ? <TypingIndicator /> : null}
          <div ref={endRef} />
        </div>
      </Section>

      {/* Suggested prompts -------------------------------------------- */}
      <Section title="Suggested prompts" defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-line bg-bg px-2 py-0.5 text-[11px] text-ink-2 hover:bg-bg-hover hover:text-ink-1"
            >
              {p}
            </button>
          ))}
        </div>
      </Section>

      {/* Compose ------------------------------------------------------- */}
      <div className="sticky bottom-0 hairline-t bg-bg-subtle px-3 py-2">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder="Ask about this file, route, or any diagnostic. ⌘⏎ to send."
            rows={2}
            className="min-h-[44px] flex-1 resize-none rounded-sm border border-line bg-bg px-2 py-1.5 font-mono text-[12px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
          />
          <div className="flex flex-col items-end gap-1">
            <Button
              size="xs"
              tone="accent"
              disabled={!draft.trim() || streaming}
              onClick={() => send(draft)}
            >
              Send <Kbd>⌘</Kbd><Kbd>⏎</Kbd>
            </Button>
            <ModelPicker model={model} onChange={setModel} />
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-3">
          <span>{messages.length} turns</span>
          <button
            onClick={() => setMessages([])}
            className="hover:text-ink-1"
            aria-label="Clear thread"
          >
            Clear thread
          </button>
        </div>
      </div>
    </Inspector>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'rounded-md border border-line/60 px-2 py-1.5 text-xs',
        isUser ? 'bg-bg-selected/60' : 'bg-bg',
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className={cn(
            'inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium tracking-caps',
            isUser
              ? 'border-accent/30 bg-accent-soft text-accent'
              : 'border-line text-ink-2',
          )}
        >
          {isUser ? 'YOU' : 'AI'}
        </span>
        {!isUser && (
          <span className="text-[10px] text-ink-3">
            {Math.round(20 + Math.random() * 60)} tokens
          </span>
        )}
      </div>
      <div className="whitespace-pre-wrap text-ink-1">{message.text}</div>
      {message.code ? (
        <pre className="mt-1.5 overflow-x-auto rounded-sm border border-line bg-bg-subtle p-2 font-mono text-[11px] leading-relaxed text-ink-1">
          <code>{message.code.body}</code>
        </pre>
      ) : null}
      {message.evidence && message.evidence.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {message.evidence.map((e, i) => (
            <Tooltip key={`${e}-${i}`} content="Open evidence" side="top">
              <button
                onClick={() => toast('Open evidence', { description: e })}
                className="rounded-sm border border-line bg-bg px-1.5 py-0 font-mono text-[10px] text-ink-2 hover:bg-bg-hover"
              >
                {e}
              </button>
            </Tooltip>
          ))}
        </div>
      ) : null}
      {!isUser ? (
        <div className="mt-1.5 flex items-center gap-1">
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              navigator.clipboard
                ?.writeText(message.code?.body ?? message.text)
                .then(() => toast('Copied to clipboard'))
                .catch(() => toast('Copy failed'));
            }}
          >
            <Icon.Doc className="h-3 w-3" />
            Copy
          </Button>
          {message.code ? (
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Insert into editor (preview)')}
            >
              <Icon.Plus className="h-3 w-3" />
              Insert
            </Button>
          ) : null}
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Run as patch (preview)')}
          >
            <Icon.Bulb className="h-3 w-3" />
            Run as patch
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-3">
      <span className="inline-flex gap-0.5">
        <span className="h-1 w-1 animate-pulse rounded-full bg-ink-3" />
        <span
          className="h-1 w-1 animate-pulse rounded-full bg-ink-3"
          style={{ animationDelay: '120ms' }}
        />
        <span
          className="h-1 w-1 animate-pulse rounded-full bg-ink-3"
          style={{ animationDelay: '240ms' }}
        />
      </span>
      <span>AI is thinking...</span>
    </div>
  );
}

function ModelPicker({
  model,
  onChange,
}: {
  model: ModelId;
  onChange(m: ModelId): void;
}) {
  return (
    <select
      value={model}
      onChange={(e) => onChange(e.target.value as ModelId)}
      className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] text-ink-2 outline-none focus:border-accent"
    >
      {(Object.keys(MODELS) as ModelId[]).map((id) => (
        <option key={id} value={id}>
          {MODELS[id].label}
        </option>
      ))}
    </select>
  );
}
