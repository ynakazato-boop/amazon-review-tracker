import { supabase } from './supabase';
import { scrapeReviews, sleep } from './scraper';

export async function runScheduledScrape(frequency?: string) {
  let query = supabase
    .from('asins')
    .select('id, asin, track_reviews, track_purchase_count');

  if (frequency) query = query.eq('frequency', frequency) as typeof query;

  const { data: asins } = await query;
  if (!asins || asins.length === 0) return;

  const { data: logData } = await supabase
    .from('execution_logs')
    .insert({ started_at: new Date().toISOString(), total: asins.length, status: 'running' })
    .select('id')
    .single();

  const logId = logData?.id;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i++) {
    const { id, asin, track_reviews, track_purchase_count } = asins[i];
    try {
      const { rating, reviewCount, purchaseCountLabel } = await scrapeReviews(asin, {
        trackReviews: Boolean(track_reviews),
        trackPurchaseCount: Boolean(track_purchase_count),
      });
      await supabase.from('review_snapshots').insert({
        asin_id: id,
        rating,
        review_count: reviewCount,
        purchase_count_label: purchaseCountLabel,
        measured_at: new Date().toISOString(),
      });
      success++;
    } catch (err) {
      console.error(`[Scraper] Failed ASIN ${asin}:`, err);
      await supabase.from('review_snapshots').insert({
        asin_id: id,
        purchase_count_label: track_purchase_count ? 'error' : null,
        measured_at: new Date().toISOString(),
      });
      failed++;
    }
    if (i < asins.length - 1) await sleep(3000 + Math.random() * 2000);
  }

  if (logId) {
    await supabase.from('execution_logs').update({
      finished_at: new Date().toISOString(),
      success,
      failed,
      status: 'completed',
    }).eq('id', logId);
  }
}
