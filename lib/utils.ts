/**
 * SQLiteのCURRENT_TIMESTAMP（"YYYY-MM-DD HH:MM:SS" UTC）と
 * toISOString()（"...Z"）の両形式を正しくUTCとして解析してJSTで返す
 */
export function parseDbDate(s: string): Date {
  if (!s) return new Date(NaN);
  // Already has timezone info (Z or +offset)
  if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  // SQLite "YYYY-MM-DD HH:MM:SS" → treat as UTC
  return new Date(s.replace(' ', 'T') + 'Z');
}

export function formatJST(
  s: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  if (!s) return '—';
  const d = parseDbDate(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', ...opts });
}

export function formatJSTFull(s: string | null | undefined): string {
  return formatJST(s, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
