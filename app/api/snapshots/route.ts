import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asinId = searchParams.get('asinId');
  const days   = parseInt(searchParams.get('days') || '30', 10);

  if (!asinId) return NextResponse.json({ error: 'asinId required' }, { status: 400 });

  const db = getDb();
  const rows = db.prepare(`
    SELECT rating, review_count, purchase_count_label, measured_at
    FROM review_snapshots
    WHERE asin_id = ?
      AND measured_at >= datetime('now', '-' || ? || ' days')
    ORDER BY measured_at ASC
  `).all(asinId, days);

  return NextResponse.json(rows);
}
