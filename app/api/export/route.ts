import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asinId = searchParams.get('asinId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = supabase
    .from('review_snapshots')
    .select('rating, review_count, purchase_count_label, measured_at, asins!inner(asin, note)')
    .order('measured_at', { ascending: true });

  if (asinId) query = query.eq('asin_id', asinId) as typeof query;
  if (startDate) query = query.gte('measured_at', startDate) as typeof query;
  if (endDate) query = query.lte('measured_at', endDate + 'T23:59:59') as typeof query;

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = 'ASIN,備考,星評価,レビュー件数,購入件数ラベル,計測日時\n';
  const body = (data || []).map((r: any) => [
    r.asins.asin,
    r.asins.note ?? '',
    r.rating ?? '',
    r.review_count ?? '',
    r.purchase_count_label ?? '',
    r.measured_at,
  ].join(',')).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reviews_${Date.now()}.csv"`,
    },
  });
}
