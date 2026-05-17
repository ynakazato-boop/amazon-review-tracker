import { describe, it, expect } from 'vitest';
import { parseDbDate, formatJST, formatJSTFull } from '../utils';

describe('parseDbDate', () => {
  it('SQLite CURRENT_TIMESTAMP形式をUTCとして解析する', () => {
    const d = parseDbDate('2026-05-14 09:36:11');
    expect(d.toISOString()).toBe('2026-05-14T09:36:11.000Z');
  });

  it('ISO文字列（Zあり）をそのまま解析する', () => {
    const d = parseDbDate('2026-05-14T09:36:08.913Z');
    expect(d.toISOString()).toBe('2026-05-14T09:36:08.913Z');
  });

  it('空文字列はNaNを返す', () => {
    expect(isNaN(parseDbDate('').getTime())).toBe(true);
  });
});

describe('formatJST', () => {
  it('UTC 09:36 → JST 18:36 に変換する', () => {
    const result = formatJST('2026-05-14 09:36:11');
    // JST = UTC+9 → 09:36 UTC = 18:36 JST
    expect(result).toContain('18:36');
  });

  it('ISOString形式でも正しくJST変換する', () => {
    const result = formatJST('2026-05-14T09:36:08.913Z');
    expect(result).toContain('18:36');
  });

  it('null/undefinedは"—"を返す', () => {
    expect(formatJST(null)).toBe('—');
    expect(formatJST(undefined)).toBe('—');
    expect(formatJST('')).toBe('—');
  });

  it('UTC 00:00 → JST 09:00 に変換する', () => {
    const result = formatJST('2026-01-01 00:00:00');
    expect(result).toContain('09:00');
  });
});

describe('formatJSTFull', () => {
  it('秒まで含む形式で返す', () => {
    const result = formatJSTFull('2026-05-14 09:36:11');
    expect(result).toContain('18:36:11');
  });
});
