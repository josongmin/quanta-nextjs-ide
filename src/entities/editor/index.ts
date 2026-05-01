// Public API for the editor entity. Owns open tabs, active tab, cursor,
// and selection. Consumed by every IDE surface that opens files.

export { useEditorStore } from './editor.store';
export type { EditorTab, CursorPosition } from './editor.store';
