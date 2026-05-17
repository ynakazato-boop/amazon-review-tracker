import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM execution_logs ORDER BY id DESC LIMIT ?')
    .all(limit);

  return NextResponse.json(rows);
}
