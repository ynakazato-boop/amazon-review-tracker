import { NextRequest, NextResponse } from 'next/server';
import { runScheduledScrape } from '@/lib/scheduler';
import getDb from '@/lib/db';
import { scrapeReviews } from '@/lib/scraper';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const asinId: number | undefined = body.asinId;

  if (asinId) {
    const db = getDb();
    const row = db.prepare(
      'SELECT id, asin, track_reviews, track_purchase_count FROM asins WHERE id = ?'
    ).get(asinId) as
      | { id: number; asin: string; track_reviews: number; track_purchase_count: number }
      | undefined;
    if (!row) return NextResponse.json({ error: 'ASIN not found' }, { status: 404 });

    const { lastInsertRowid: logId } = db
      .prepare("INSERT INTO execution_logs (started_at, total, status) VALUES (?, 1, 'running')")
      .run(new Date().toISOString());

    try {
      const { rating, reviewCount, purchaseCountLabel } = await scrapeReviews(row.asin, {
        trackReviews: Boolean(row.track_reviews),
        trackPurchaseCount: Boolean(row.track_purchase_count),
      });
      db.prepare(
        'INSERT INTO review_snapshots (asin_id, rating, review_count, purchase_count_label, measured_at) VALUES (?, ?, ?, ?, ?)'
      ).run(row.id, rating, reviewCount, purchaseCountLabel, new Date().toISOString());
      db.prepare(
        "UPDATE execution_logs SET finished_at=?,success=1,failed=0,status='completed' WHERE id=?"
      ).run(new Date().toISOString(), logId);
      return NextResponse.json({ rating, reviewCount, purchaseCountLabel });
    } catch (err) {
      // スクレイピング失敗: エラーを記録してエラースナップショットを保存
      const purchaseLabel = row.track_purchase_count ? 'error' : null;
      db.prepare(
        'INSERT INTO review_snapshots (asin_id, purchase_count_label, measured_at) VALUES (?, ?, ?)'
      ).run(row.id, purchaseLabel, new Date().toISOString());
      db.prepare(
        "UPDATE execution_logs SET finished_at=?,success=0,failed=1,status='failed' WHERE id=?"
      ).run(new Date().toISOString(), logId);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // 全ASIN
  runScheduledScrape().catch(console.error);
  return NextResponse.json({ ok: true, message: '計測を開始しました' });
}
