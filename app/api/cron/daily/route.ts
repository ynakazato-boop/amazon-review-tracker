import { NextResponse } from 'next/server';
import { runScheduledScrape } from '@/lib/scheduler';

export async function GET() {
  await runScheduledScrape('daily');
  return NextResponse.json({ ok: true });
}
