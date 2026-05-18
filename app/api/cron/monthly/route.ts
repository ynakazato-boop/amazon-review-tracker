import { NextResponse } from 'next/server';
import { runScheduledScrape } from '@/lib/scheduler';

export async function GET() {
  await runScheduledScrape('monthly');
  return NextResponse.json({ ok: true });
}
