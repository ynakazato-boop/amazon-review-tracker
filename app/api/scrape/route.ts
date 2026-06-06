import { NextRequest, NextResponse } from 'next/server';
import { runScheduledScrape } from '@/lib/scheduler';
import { supabase } from '@/lib/supabase';
import { scrapeReviews } from '@/lib/scraper';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const asinId: number | undefined = body.asinId;

  if (asinId) {
    const { data: row } = await supabase
      .from('asins')
      .select('id, asin, track_reviews, track_purchase_count')
      .eq('id', asinId)
      .single();

    if (!row) return NextResponse.json({ error: 'ASIN not found' }, { status: 404 });

    const { data: logData } = await supabase
      .from('execution_logs')
      .insert({ started_at: new Date().toISOString(), total: 1, status: 'running' })
      .select('id')
      .single();

    const logId = logData?.id;

    try {
      const { rating, reviewCount, purchaseCountLabel } = await scrapeReviews(row.asin, {
        trackReviews: Boolean(row.track_reviews),
        trackPurchaseCount: Boolean(row.track_purchase_count),
      });
      await supabase.from('review_snapshots').insert({
        asin_id: row.id,
        rating,
        review_count: reviewCount,
        purchase_count_label: purchaseCountLabel,
        measured_at: new Date().toISOString(),
      });
      if (logId) {
        await supabase.from('execution_logs').update({
          finished_at: new Date().toISOString(),
          success: 1,
          failed: 0,
          status: 'completed',
        }).eq('id', logId);
      }
      return NextResponse.json({ rating, reviewCount, purchaseCountLabel });
    } catch (err) {
      await supabase.from('review_snapshots').insert({
        asin_id: row.id,
        purchase_count_label: row.track_purchase_count ? 'error' : null,
        measured_at: new Date().toISOString(),
      });
      if (logId) {
        await supabase.from('execution_logs').update({
          finished_at: new Date().toISOString(),
          success: 0,
          failed: 1,
          status: 'failed',
        }).eq('id', logId);
      }
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  await runScheduledScrape();
  return NextResponse.json({ ok: true, message: '計測が完了しました' });
}
