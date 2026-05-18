import { runScheduledScrape } from '../lib/scheduler';

async function main() {
  console.log(`[Scrape] Starting at ${new Date().toLocaleString('ja-JP')}`);
  await runScheduledScrape('daily');
  console.log(`[Scrape] Finished at ${new Date().toLocaleString('ja-JP')}`);
  process.exit(0);
}

main().catch(err => {
  console.error('[Scrape] Error:', err);
  process.exit(1);
});
