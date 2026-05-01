import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Icon, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { isMac } from '@shared/lib/keys';

/**
 * True when focus is inside a text-editable element. Mirrors the helper used by
 * the global keybindings so we don't hijack typing.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.monaco-editor')) return true;
  return false;
}

/**
 * Registers ⌘⇧F (Cmd+Shift+F on Mac, Ctrl+Shift+F elsewhere) to toggle focus
 * mode, and Esc to exit focus when it is on. Esc is non-destructive — it only
 * closes focus mode (other Esc handlers continue to work in normal mode).
 */
export function useFocusModeKeybinding(): void {
  const focusMode = useUiStore((s) => s.focusMode);
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      // ⌘⇧F — toggle (allowed even in editable targets — it's a window cmd).
      if (mod && e.shiftKey && key === 'f') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      // Esc — exit focus mode if active. Don't preventDefault so other Esc
      // handlers (overlay close) keep functioning when focus mode is off.
      if (focusMode && e.key === 'Escape' && !isEditableTarget(e.target)) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, toggleFocusMode, setFocusMode]);
}

interface IndicatorProps {
  className?: string;
}

/**
 * Top-bar button that toggles focus mode. When active, the button takes the
 * accent treatment so the current state is unambiguous.
 */
export function FocusModeIndicator({ className }: IndicatorProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode);
  return (
    <Tooltip content="Focus mode (⌘⇧F)" side="bottom">
      <Button
        tone={focusMode ? 'accent' : 'ghost'}
        size="icon"
        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        aria-pressed={focusMode}
        onClick={toggleFocusMode}
        className={cn('transition-colors', className)}
      >
        <Icon.Layers className="h-3.5 w-3.5" />
      </Button>
    </Tooltip>
  );
}
