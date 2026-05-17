import getDb from './db';
import { scrapeReviews, sleep } from './scraper';

export async function runScheduledScrape(frequency?: string) {
  const db = getDb();

  const asins = (
    frequency
      ? db.prepare('SELECT id, asin, track_reviews, track_purchase_count FROM asins WHERE frequency = ?').all(frequency)
      : db.prepare('SELECT id, asin, track_reviews, track_purchase_count FROM asins').all()
  ) as { id: number; asin: string; track_reviews: number; track_purchase_count: number }[];

  if (asins.length === 0) return;

  const { lastInsertRowid: logId } = db
    .prepare("INSERT INTO execution_logs (started_at, total, status) VALUES (?, ?, 'running')")
    .run(new Date().toISOString(), asins.length);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i++) {
    const { id, asin, track_reviews, track_purchase_count } = asins[i];
    try {
      const { rating, reviewCount, purchaseCountLabel } = await scrapeReviews(asin, {
        trackReviews: Boolean(track_reviews),
        trackPurchaseCount: Boolean(track_purchase_count),
      });
      db.prepare(
        'INSERT INTO review_snapshots (asin_id, rating, review_count, purchase_count_label, measured_at) VALUES (?, ?, ?, ?, ?)'
      ).run(id, rating, reviewCount, purchaseCountLabel, new Date().toISOString());
      success++;
    } catch (err) {
      console.error(`[Scraper] Failed ASIN ${asin}:`, err);
      // スクレイピング失敗時: 購入件数を "error" で記録（ダッシュボードに「取得失敗」表示）
      db.prepare(
        'INSERT INTO review_snapshots (asin_id, purchase_count_label, measured_at) VALUES (?, ?, ?)'
      ).run(id, track_purchase_count ? 'error' : null, new Date().toISOString());
      failed++;
    }
    if (i < asins.length - 1) {
      await sleep(3000 + Math.random() * 2000);
    }
  }

  db.prepare(
    'UPDATE execution_logs SET finished_at = ?, success = ?, failed = ?, status = ? WHERE id = ?'
  ).run(new Date().toISOString(), success, failed, 'completed', logId);
}
