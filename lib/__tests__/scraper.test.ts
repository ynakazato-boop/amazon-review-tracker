import { describe, it, expect } from 'vitest';

// scraper内部のロジック（regex）を直接テスト
const RATING_PATTERNS = [
  { input: '5つ星のうち4.5',       expected: 4.5 },
  { input: '5つのうち4.1つ',       expected: 4.1 },
  { input: '5つ星のうち3.8',       expected: 3.8 },
  { input: '5 out of 5 stars',     expected: null },  // 小数点なし → マッチしない
  { input: '',                     expected: null },
];

const COUNT_PATTERNS = [
  { input: '55グローバルレーティング', expected: 55 },
  { input: '(125)',                  expected: 125 },
  { input: '1,234件の評価',          expected: 1234 },
  { input: '10,005件のグローバル評価', expected: 10005 },
  { input: '',                       expected: null },
];

function extractRating(text: string): number | null {
  const m = text.match(/(\d+[.,]\d+)/);
  if (!m) return null;
  return parseFloat(m[1].replace(',', '.'));
}

function extractCount(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? parseInt(digits) : null;
}

describe('extractRating', () => {
  for (const { input, expected } of RATING_PATTERNS) {
    it(`"${input}" → ${expected}`, () => {
      expect(extractRating(input)).toBe(expected);
    });
  }
});

describe('extractCount', () => {
  for (const { input, expected } of COUNT_PATTERNS) {
    it(`"${input}" → ${expected}`, () => {
      expect(extractCount(input)).toBe(expected);
    });
  }
});

describe('ASIN validation', () => {
  const ASIN_REGEX = /^[A-Z0-9]{10}$/;

  it('有効なASINを受け入れる', () => {
    expect(ASIN_REGEX.test('B0G2MHRD36')).toBe(true);
    expect(ASIN_REGEX.test('B07XJF32DQ')).toBe(true);
    expect(ASIN_REGEX.test('B0DJGV51R1')).toBe(true);
  });

  it('無効なASINを弾く', () => {
    expect(ASIN_REGEX.test('B0G2MHRD3')).toBe(false);   // 9文字
    expect(ASIN_REGEX.test('b0g2mhrd36')).toBe(false);  // 小文字
    expect(ASIN_REGEX.test('B0G2MHRD36X')).toBe(false); // 11文字
    expect(ASIN_REGEX.test('')).toBe(false);
  });
});
