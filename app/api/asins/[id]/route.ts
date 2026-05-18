import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from('asins').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { data: row, error: fetchError } = await supabase
    .from('asins')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('asins')
    .update({
      note: 'note' in body ? (body.note?.trim() || null) : row.note,
      frequency: 'frequency' in body ? (body.frequency || 'daily') : row.frequency,
      track_reviews: 'track_reviews' in body ? (body.track_reviews ? 1 : 0) : row.track_reviews,
      track_purchase_count: 'track_purchase_count' in body ? (body.track_purchase_count ? 1 : 0) : row.track_purchase_count,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
