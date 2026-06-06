import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
];

export interface ScrapeOptions {
  trackReviews?: boolean;
  trackPurchaseCount?: boolean;
}

export interface ScrapeResult {
  rating: number | null;
  reviewCount: number | null;
  /** null=表示なし（正常）, 文字列=取得成功, "error"=取得失敗 */
  purchaseCountLabel: string | null;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchPage(asin: string, opts: Required<ScrapeOptions>): Promise<ScrapeResult> {
  const url = `https://www.amazon.co.jp/dp/${asin}`;

  const { data } = await axios.get<string>(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.amazon.co.jp/',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
    },
    timeout: 12000,
  });

  const $ = cheerio.load(data);

  // ブロックページ検知（CAPTCHA・ロボットチェック・ログイン要求など）
  const pageTitle = $('title').text().toLowerCase();
  if (
    $('form[action*="validateCaptcha"]').length > 0 ||
    pageTitle.includes('robot check') ||
    pageTitle.includes('robots') ||
    pageTitle.includes('sorry') ||
    $('body').text().includes('Enter the characters you see below') ||
    $('body').text().includes('ロボットによるアクセスと判断')
  ) {
    throw new Error(`ブロック検知: ASIN ${asin}`);
  }

  let rating: number | null = null;
  let reviewCount: number | null = null;
  let purchaseCountLabel: string | null = null;

  if (opts.trackReviews) {
    for (const sel of [
      '#acrPopover',
      'span[data-hook="rating-out-of-text"]',
      '#acrPopover span.a-icon-alt',
      '.averageStarRatingNumerical span',
    ]) {
      const el = $(sel).first();
      // title 属性を優先（属性値は確実に数字のみ含む）
      const text = (el.attr('title') || el.text()).trim();
      const m = text.match(/(\d+[.,]\d+)/);
      if (m) { rating = parseFloat(m[1].replace(',', '.')); break; }
    }

    for (const sel of [
      'span[data-hook="total-review-count"]',
      '#acrCustomerReviewText',
      'span[data-hook="total-reviews-count-text"]',
      '#acrCustomerReviewLink',
    ]) {
      const text = $(sel).first().text().trim();
      const digits = text.replace(/[^\d]/g, '');
      if (digits) { reviewCount = parseInt(digits); break; }
    }
  }

  if (opts.trackPurchaseCount) {
    // 過去1か月の購入件数テキストを取得
    for (const sel of [
      '#social-proofing-faceout-title-tk_bought',
      '#social-proofing-faceout-title-tk_bought_new',
      'span[data-hook="aod-atf-social-proofing"]',
    ]) {
      const text = $(sel).first().text().trim();
      if (text) { purchaseCountLabel = text; break; }
    }

    // フォールバック: id/classに social-proofing を含む要素で「過去N月」テキストを検索
    if (!purchaseCountLabel) {
      $('[id*="social-proofing"], [id*="tk_bought"]').each((_, el) => {
        const t = $(el).text().trim();
        if (/過去.{1,5}[かヶ]月/.test(t) && t.length < 100) {
          purchaseCountLabel = t;
          return false;
        }
      });
    }
    // null のまま = Amazonがこの商品に購入件数を表示していない（正常）
  }

  return { rating, reviewCount, purchaseCountLabel };
}

// Amazonがbot検知時にレビューセクションを省いたページを返すことがある。
// track_reviews=true の場合、null なら最大2回リトライし、
// それでも取得できなければエラーをthrowする（nullスナップショットをDBに保存しない）。
export async function scrapeReviews(
  asin: string,
  opts: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const trackReviews = opts.trackReviews ?? true;
  const trackPurchaseCount = opts.trackPurchaseCount ?? true;

  if (!trackReviews && !trackPurchaseCount) {
    return { rating: null, reviewCount: null, purchaseCountLabel: null };
  }

  const fullOpts: Required<ScrapeOptions> = { trackReviews, trackPurchaseCount };
  const result = await fetchPage(asin, fullOpts);

  // レビュー計測ONの場合のみ、nullでリトライ判定
  const reviewsMissing = trackReviews && result.rating === null && result.reviewCount === null;
  if (!reviewsMissing) return result;

  // 1回目リトライ: 3〜5秒待機
  await sleep(3000 + Math.random() * 2000);
  const retry1 = await fetchPage(asin, fullOpts);
  if (!(trackReviews && retry1.rating === null && retry1.reviewCount === null)) return retry1;

  // 2回目リトライ: さらに5〜8秒待機
  await sleep(5000 + Math.random() * 3000);
  const retry2 = await fetchPage(asin, fullOpts);
  if (!(trackReviews && retry2.rating === null && retry2.reviewCount === null)) return retry2;

  throw new Error(`レビューデータ取得失敗: ASIN ${asin} (3回試行後もデータなし)`);
}
