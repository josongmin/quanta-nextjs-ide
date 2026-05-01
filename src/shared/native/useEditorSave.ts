import { useEffect } from 'react';
import { toast } from 'sonner';
import { useEditorStore } from '@entities/editor';
import { isNative, onNativeMenu } from '.';
import { saveTextFile } from '@shared/shell/file-ops';

/**
 * Listens for the native File → Save menu item (`save` action ID emitted
 * from `lib.rs#build_app_menu`) and writes the active editor's buffer
 * through the Tauri fs plugin.
 *
 * On the web build the menu event never fires (and the shell would throw
 * even if it did), so this hook is a no-op there.
 *
 * Today this saves the *current source* of the active tab. Phase next:
 * wire to the Monaco editor instance so the buffer (with unsaved edits)
 * is what gets written, not the cached snapshot.
 */
export function useEditorSave(): void {
  useEffect(() => {
    if (!isNative()) return;
    return onNativeMenu(async (action) => {
      if (action !== 'save') return;
      const editorState = useEditorStore.getState() as unknown as {
        activeTabId?: string | null;
        tabs?: ReadonlyArray<{ id: string; file?: string; source?: string }>;
      };
      const tab = editorState.tabs?.find((t) => t.id === editorState.activeTabId);
      if (!tab?.file || tab.source == null) {
        toast('No active file to save');
        return;
      }
      try {
        await saveTextFile(tab.file, tab.source);
        toast.success(`Saved ${tab.file.split('/').pop() ?? tab.file}`);
      } catch (e) {
        toast.error(`Save failed: ${(e as Error).message}`);
      }
    });
  }, []);
}
