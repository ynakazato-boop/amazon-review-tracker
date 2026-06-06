import { NextResponse } from 'next/server';
import { runScheduledScrape } from '@/lib/scheduler';

export const maxDuration = 60;

export async function GET() {
  await runScheduledScrape('weekly');
  return NextResponse.json({ ok: true });
}
