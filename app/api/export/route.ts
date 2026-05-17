import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asinId    = searchParams.get('asinId');
  const startDate = searchParams.get('startDate');
  const endDate   = searchParams.get('endDate');

  const db = getDb();

  let query = `
    SELECT a.asin, a.note, s.rating, s.review_count, s.purchase_count_label, s.measured_at
    FROM review_snapshots s
    JOIN asins a ON a.id = s.asin_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (asinId)    { query += ' AND s.asin_id = ?'; params.push(asinId); }
  if (startDate) { query += ' AND s.measured_at >= ?'; params.push(startDate); }
  if (endDate)   { query += ' AND s.measured_at <= ?'; params.push(endDate + ' 23:59:59'); }
  query += ' ORDER BY a.asin, s.measured_at ASC';

  const rows = db.prepare(query).all(...params) as {
    asin: string; note: string | null; rating: number | null;
    review_count: number | null; purchase_count_label: string | null; measured_at: string;
  }[];

  const header = 'ASIN,備考,星評価,レビュー件数,購入件数ラベル,計測日時\n';
  const body = rows.map(r =>
    [
      r.asin,
      r.note ?? '',
      r.rating ?? '',
      r.review_count ?? '',
      r.purchase_count_label ?? '',
      r.measured_at,
    ].join(',')
  ).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reviews_${Date.now()}.csv"`,
    },
  });
}
