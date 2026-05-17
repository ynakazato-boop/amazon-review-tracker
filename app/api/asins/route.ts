import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { maybeInitCron } from '@/lib/cronInit';

export async function GET() {
  maybeInitCron();
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      a.id, a.asin, a.note, a.frequency, a.created_at,
      a.track_reviews, a.track_purchase_count,
      s1.rating                AS latest_rating,
      s1.review_count          AS latest_count,
      s1.purchase_count_label  AS latest_purchase_count_label,
      s1.measured_at           AS latest_measured_at,
      s2.rating                AS prev_rating,
      s2.review_count          AS prev_count,
      s2.purchase_count_label  AS prev_purchase_count_label
    FROM asins a
    LEFT JOIN review_snapshots s1
      ON s1.id = (SELECT id FROM review_snapshots WHERE asin_id = a.id ORDER BY id DESC LIMIT 1)
    LEFT JOIN review_snapshots s2
      ON s2.id = (SELECT id FROM review_snapshots WHERE asin_id = a.id ORDER BY id DESC LIMIT 1 OFFSET 1)
    ORDER BY a.created_at DESC
  `).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { asin, note, frequency, track_reviews, track_purchase_count } = await req.json();

  if (!asin || !/^[A-Z0-9]{10}$/.test(asin.trim().toUpperCase())) {
    return NextResponse.json({ error: '有効なASIN（英数字10桁）を入力してください' }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare('INSERT INTO asins (asin, note, frequency, track_reviews, track_purchase_count) VALUES (?, ?, ?, ?, ?)')
      .run(
        asin.trim().toUpperCase(),
        note?.trim() || null,
        frequency || 'daily',
        track_reviews === false ? 0 : 1,
        track_purchase_count === false ? 0 : 1,
      );
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'このASINは既に登録されています' }, { status: 409 });
  }
}
