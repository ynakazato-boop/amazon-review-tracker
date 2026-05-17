import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM asins WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const row = db.prepare('SELECT * FROM asins WHERE id = ?').get(id) as {
    note: string | null; frequency: string; track_reviews: number; track_purchase_count: number;
  } | undefined;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare(
    'UPDATE asins SET note = ?, frequency = ?, track_reviews = ?, track_purchase_count = ? WHERE id = ?'
  ).run(
    'note' in body ? (body.note?.trim() || null) : row.note,
    'frequency' in body ? (body.frequency || 'daily') : row.frequency,
    'track_reviews' in body ? (body.track_reviews ? 1 : 0) : row.track_reviews,
    'track_purchase_count' in body ? (body.track_purchase_count ? 1 : 0) : row.track_purchase_count,
    id
  );
  return NextResponse.json({ ok: true });
}
