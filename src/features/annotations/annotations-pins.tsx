import { useState, type ReactNode } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Icon, Popover, PopoverContent, PopoverTrigger } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface PinProps {
  index: number;
  body: string;
  file: string;
  line: number;
  id: string;
}

/**
 * Circular pin button with a number badge. Click → popover with body and
 * mute / delete actions.
 */
export function AnnotationPin({ index, body, file, line, id }: PinProps) {
  const removeAnnotation = useUiStore((s) => s.removeAnnotation);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'pointer-events-auto inline-flex h-4 w-4 select-none items-center justify-center',
            'rounded-full border border-accent bg-accent text-[9px] font-bold leading-none text-white',
            'shadow-pop transition-transform hover:scale-110',
          )}
          aria-label={`Annotation ${index} on ${file}:${line}`}
        >
          {index}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-72 p-2.5"
      >
        <div className="flex items-center gap-2">
          <Icon.Pin className="h-3 w-3 text-accent" />
          <span className="font-mono text-[10px] text-ink-3 truncate">
            {file}:{line}
          </span>
          <button
            type="button"
            onClick={() => {
              removeAnnotation(id);
              setOpen(false);
            }}
            className="ml-auto rounded-sm p-1 text-ink-3 hover:bg-bg-hover hover:text-sev-err"
            aria-label="Delete annotation"
          >
            <Icon.X className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-xs text-ink-1">{body}</p>
        <div className="mt-2 flex items-center justify-end gap-1">
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              removeAnnotation(id);
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ComposerProps {
  file: string;
  line: number;
  children: ReactNode;
  /** Called after a successful save. */
  onSaved?(): void;
}

/**
 * Popover form for creating a new annotation. The trigger element is supplied
 * by the consumer so the composer can be anchored anywhere on the layer.
 */
export function AnnotationComposer({ file, line, children, onSaved }: ComposerProps) {
  const addAnnotation = useUiStore((s) => s.addAnnotation);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const handleSave = () => {
    const body = draft.trim();
    if (!body) return;
    addAnnotation({ file, line, body });
    setDraft('');
    setOpen(false);
    onSaved?.();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setDraft('');
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80 p-3">
        <div className="flex items-center gap-2">
          <Icon.Pin className="h-3 w-3 text-accent" />
          <span className="text-sm font-semibold text-ink-1">Add note</span>
          <span className="ml-auto font-mono text-[10px] text-ink-3 truncate">
            {file}:{line}
          </span>
        </div>
        <textarea
          autoFocus
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Why this matters here…"
          className={cn(
            'mt-2 w-full resize-none rounded-sm border border-line bg-bg px-2 py-1.5 text-xs text-ink-1',
            'outline-none placeholder:text-ink-3 focus:border-accent',
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        <div className="mt-2 flex items-center justify-end gap-1">
          <Button size="xs" tone="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="xs"
            tone="accent"
            disabled={!draft.trim()}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
