import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asinId = searchParams.get('asinId');
  const days = parseInt(searchParams.get('days') || '30', 10);

  if (!asinId) return NextResponse.json({ error: 'asinId required' }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('review_snapshots')
    .select('rating, review_count, purchase_count_label, measured_at')
    .eq('asin_id', asinId)
    .gte('measured_at', since.toISOString())
    .order('measured_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
