import store from './_shared/data-store.js';
import monitor from './_shared/election-monitor.js';
import scheduledEvent from './_shared/scheduled-event.js';
import surveySources from '../../data/government/election-survey-sources.json' with { type: 'json' };
import ledger from '../../data/government/africa-election-tracker.json' with { type: 'json' };

// Scheduled-only. Netlify blocks HTTP invocation of this declared entrypoint.
export default async (request) => {
  const body = await request.text();
  const event = { httpMethod: request.method, headers: Object.fromEntries(request.headers), body };
  if (!scheduledEvent.isScheduledEvent(event, 'scheduled-election-monitor')) throw new Error('Scheduled invocation required');
  const previous = await store.getData('election-monitor-latest');
  const report = await monitor.collect(ledger, previous, undefined, undefined, surveySources.sources);
  const saved = await store.setData('election-monitor-latest',report);
  if (!saved) throw new Error('Election monitoring evidence was not persisted');
  console.log(JSON.stringify({job:'scheduled-election-monitor',checkedAt:report.lastCheckedAt,status:report.status,
    sources:report.sources.length,failures:report.sources.filter((source) => source.status==='unavailable' || source.status==='blocked').length}));
};
