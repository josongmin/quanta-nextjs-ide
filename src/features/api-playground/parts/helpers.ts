export const METHOD_TONE: Record<string, 'info' | 'warn' | 'err' | 'static' | 'muted'> = {
  GET: 'info',
  POST: 'static',
  PUT: 'warn',
  PATCH: 'warn',
  DELETE: 'err',
};

export function statusTone(status: number): 'info' | 'warn' | 'err' | 'static' {
  if (status >= 500) return 'err';
  if (status >= 400) return 'warn';
  if (status >= 200 && status < 300) return 'static';
  return 'info';
}
