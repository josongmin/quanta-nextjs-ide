import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';

interface Line {
  kind: 'prompt' | 'out' | 'err';
  text: string;
}

const PROMPT = 'nss web/main >';

const INITIAL_LINES: Line[] = [
  { kind: 'out', text: 'Next Static Studio mock terminal — interactive shell not wired in this prototype.' },
  { kind: 'out', text: 'Try: `help`, `routes`, `tags`, `clear`.' },
];

function fakeRun(cmd: string): Line[] {
  const trimmed = cmd.trim();
  if (!trimmed) return [];
  if (trimmed === 'clear') return [{ kind: 'out', text: '__CLEAR__' }];
  if (trimmed === 'help') {
    return [
      { kind: 'out', text: 'Available (mock) commands:' },
      { kind: 'out', text: '  routes        list app routes' },
      { kind: 'out', text: '  tags          list cache tags' },
      { kind: 'out', text: '  diff          summarize semantic diff' },
      { kind: 'out', text: '  clear         clear terminal' },
    ];
  }
  if (trimmed === 'routes') {
    return [
      { kind: 'out', text: '17 routes indexed.' },
      { kind: 'out', text: '  /                       static  A' },
      { kind: 'out', text: '  /products               isr     B' },
      { kind: 'out', text: '  /products/[id]          isr     B  (4 risks)' },
      { kind: 'out', text: '  /checkout               dyn     D  (7 risks ⚠)' },
      { kind: 'out', text: '  …' },
    ];
  }
  if (trimmed === 'tags') {
    return [
      { kind: 'out', text: '8 cache tags indexed (1 inconsistency group: products).' },
      { kind: 'out', text: '  products       4 producers · 1 invalidator' },
      { kind: 'out', text: '  product:{id}   1 producer  · 1 invalidator' },
      { kind: 'out', text: '  reviews        1 producer  · 0 invalidators ⚠' },
    ];
  }
  if (trimmed === 'diff') {
    return [
      { kind: 'out', text: 'feature/checkout-overhaul vs main · 9 semantic changes' },
      { kind: 'out', text: '  rendering   3' },
      { kind: 'out', text: '  cache       2' },
      { kind: 'out', text: '  boundary    1' },
      { kind: 'out', text: '  auth        1' },
      { kind: 'out', text: '  contract    1' },
      { kind: 'out', text: '  cost        1' },
    ];
  }
  return [{ kind: 'err', text: `nss: command not found: ${trimmed}` }];
}

export function TerminalTab() {
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistoryIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = input;
    const out = fakeRun(cmd);
    if (out.some((l) => l.text === '__CLEAR__')) {
      setLines([]);
    } else {
      setLines((prev) => [...prev, { kind: 'prompt', text: cmd }, ...out]);
    }
    setHistory((h) => (cmd.trim() ? [...h, cmd] : h));
    setHistoryIdx(null);
    setInput('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIdx((idx) => {
        const next = idx == null ? history.length - 1 : Math.max(0, idx - 1);
        setInput(history[next] ?? '');
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIdx((idx) => {
        if (idx == null) return null;
        const next = idx + 1;
        if (next >= history.length) {
          setInput('');
          return null;
        }
        setInput(history[next] ?? '');
        return next;
      });
    }
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-bg"
      onClick={() => inputRef.current?.focus()}
    >
      <PanelHeader>
        <Icon.Terminal className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-[11px] text-ink-3">shell</span>
        <span className="font-mono text-[11px] text-ink-1">{PROMPT}</span>
        <span className="text-ink-3">·</span>
        <span className="text-[11px] text-ink-3">mock</span>
      </PanelHeader>

      <ScrollArea className="flex-1">
        <div className="px-3 py-2 font-mono text-[11px] leading-relaxed">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              {l.kind === 'prompt' ? (
                <>
                  <span className="text-accent">{PROMPT}</span>
                  <span className="text-ink-1">{l.text}</span>
                </>
              ) : (
                <span
                  className={cn(
                    l.kind === 'out' && 'text-ink-2',
                    l.kind === 'err' && 'text-sev-err',
                  )}
                >
                  {l.text}
                </span>
              )}
            </div>
          ))}
          <div ref={scrollEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={submit}
        className="flex h-7 shrink-0 items-center gap-2 hairline-t bg-bg-subtle px-3"
      >
        <span className="font-mono text-[11px] text-accent">{PROMPT}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          autoComplete="off"
          aria-label="Mock terminal input"
          className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:outline-none"
          placeholder="type a mock command and press enter"
        />
      </form>
    </div>
  );
}
