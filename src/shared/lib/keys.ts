// Cross-platform keyboard helpers.
export const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
export const modKey = isMac ? '⌘' : 'Ctrl';
export const altKey = isMac ? '⌥' : 'Alt';
export const shiftKey = '⇧';

export function fmtKbd(parts: string[]): string {
  return parts.join('');
}
