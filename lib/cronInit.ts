import { runScheduledScrape } from './scheduler';

let initialized = false;

export function maybeInitCron() {
  if (initialized) return;
  initialized = true;

  import('node-cron')
    .then(m => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cron = (m as any).default ?? m;
      cron.schedule('0 9 * * *', () => runScheduledScrape('daily'));
      cron.schedule('0 9 * * 1', () => runScheduledScrape('weekly'));
      cron.schedule('0 9 1 * *', () => runScheduledScrape('monthly'));
      console.log('[Scheduler] Cron jobs initialized (daily=09:00, weekly=Mon 09:00, monthly=1st 09:00)');
    })
    .catch(err => console.error('[Scheduler] Init failed:', err));
}
