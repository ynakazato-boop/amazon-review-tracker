import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: asins, error } = await supabase
    .from('asins')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!asins || asins.length === 0) return NextResponse.json([]);

  const result = await Promise.all(
    asins.map(async (asin) => {
      const { data: snapshots } = await supabase
        .from('review_snapshots')
        .select('rating, review_count, purchase_count_label, measured_at')
        .eq('asin_id', asin.id)
        .order('id', { ascending: false })
        .limit(2);

      return {
        ...asin,
        latest_rating: snapshots?.[0]?.rating ?? null,
        latest_count: snapshots?.[0]?.review_count ?? null,
        latest_purchase_count_label: snapshots?.[0]?.purchase_count_label ?? null,
        latest_measured_at: snapshots?.[0]?.measured_at ?? null,
        prev_rating: snapshots?.[1]?.rating ?? null,
        prev_count: snapshots?.[1]?.review_count ?? null,
        prev_purchase_count_label: snapshots?.[1]?.purchase_count_label ?? null,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { asin, note, frequency, track_reviews, track_purchase_count } = await req.json();

  if (!asin || !/^[A-Z0-9]{10}$/.test(asin.trim().toUpperCase())) {
    return NextResponse.json({ error: '有効なASIN（英数字10桁）を入力してください' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('asins')
    .insert({
      asin: asin.trim().toUpperCase(),
      note: note?.trim() || null,
      frequency: frequency || 'daily',
      track_reviews: track_reviews === false ? 0 : 1,
      track_purchase_count: track_purchase_count === false ? 0 : 1,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'このASINは既に登録されています' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
