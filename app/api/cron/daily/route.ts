import { NextResponse } from 'next/server';
import { runScheduledScrape, runDailyPurchaseCountScrape } from '@/lib/scheduler';

export const maxDuration = 60;

export async function GET() {
  await runScheduledScrape('daily');
  await runDailyPurchaseCountScrape();
  return NextResponse.json({ ok: true });
}
