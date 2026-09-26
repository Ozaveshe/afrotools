const assert = require('assert/strict');
const releaseMetadata = require('../netlify/functions/_shared/function-release');
const originalReleaseReader = releaseMetadata.getFunctionReleaseMetadata;
let syntheticCommit = 'a'.repeat(40);
releaseMetadata.getFunctionReleaseMetadata = () => ({ commit: syntheticCommit });
const { syncScholarshipMirror } = require('../netlify/functions/_shared/scholarship-platform');

const naturalEvent = { httpMethod: 'POST', body: '{"next_run":"2026-09-26T06:34:00Z"}' };
const manualEvent = { httpMethod: 'POST', headers: { authorization: 'Bearer synthetic-private-value' }, body: '{"next_run":"2026-09-26T06:34:00Z"}' };

async function captureRun(event) {
  let inserted;
  const stop = new Error('Synthetic stop after provenance insert');
  const client = {
    from(table) {
      if (table === 'scholarship_sources') return {
        upsert: async () => ({ error: null }),
        select: () => ({ eq: () => ({ order: async () => ({ data: [{ id: 'synthetic-source' }], error: null }) }) })
      };
      assert.equal(table, 'scholarship_ingest_runs');
      return { insert(payload) {
        inserted = payload;
        return { select: () => ({ single: async () => ({ error: stop }) }) };
      } };
    }
  };
  await assert.rejects(syncScholarshipMirror({ client, scheduledEvent: event }), error => error === stop);
  return inserted;
}

(async () => {
  try {
    const scheduled = await captureRun(naturalEvent);
    assert.equal(scheduled.source_id, 'synthetic-source');
    assert.equal(scheduled.fetch_meta.trigger, 'netlify-schedule');
    assert.equal(scheduled.fetch_meta.function_name, 'scheduled-verify-scholarships');
    assert.equal(scheduled.fetch_meta.release_commit, 'a'.repeat(40));
    assert.ok(Number.isFinite(Date.parse(scheduled.fetch_meta.invocation_started_at)));
    for (const event of [undefined, manualEvent, { body: '{"next_run":"invalid"}' }]) {
      const manual = await captureRun(event);
      assert.equal(manual.fetch_meta.trigger, 'manual-or-unknown');
      assert.ok(!JSON.stringify(manual).includes('synthetic-private-value'));
      assert.ok(!JSON.stringify(manual).includes('next_run'));
    }
    syntheticCommit = null;
    assert.equal((await captureRun(naturalEvent)).fetch_meta.release_commit, null);
  } finally {
    releaseMetadata.getFunctionReleaseMetadata = originalReleaseReader;
  }

  const names = ['../netlify/functions/_shared/scholarship-platform', '../netlify/functions/_shared/data-store', '../netlify/functions/_shared/scheduled-proof', '../netlify/functions/scheduled-verify-scholarships'];
  const paths = names.map(name => require.resolve(name));
  const original = paths.map(file => require.cache[file]);
  const writes = [], calls = [];
  let fail = false;
  try {
    require.cache[paths[0]] = { id: paths[0], filename: paths[0], loaded: true, exports: {
      syncScholarshipMirror: async options => {
        calls.push(options);
        if (fail) throw new Error('Synthetic sync failure');
        return { scholarships: [{ id: 'synthetic' }], meta: { mode: 'curated' } };
      }
    } };
    require.cache[paths[1]] = { id: paths[1], filename: paths[1], loaded: true, exports: {
      setData: async (key, data) => { writes.push({ key, data }); return true; }
    } };
    delete require.cache[paths[2]];
    delete require.cache[paths[3]];
    const { handler } = require(names[3]);
    assert.equal((await handler(naturalEvent)).statusCode, 200);
    assert.equal(calls[0].scheduledEvent, naturalEvent);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].key, 'scheduled-proof-scheduled-verify-scholarships');
    assert.equal(writes[0].data.trigger, 'netlify-schedule');
    assert.equal(writes[0].data.ok, true);
    await handler(manualEvent);
    assert.equal(writes.length, 1, 'manual invocation must not overwrite natural proof');
    fail = true;
    assert.equal((await handler(naturalEvent)).statusCode, 500);
    assert.equal(writes.length, 2);
    assert.equal(writes[1].data.ok, false);
    assert.equal(writes[1].data.status, 'failed');
  } finally {
    paths.forEach((file, i) => {
      if (original[i]) require.cache[file] = original[i];
      else delete require.cache[file];
    });
  }
  console.log('Scholarship scheduled provenance: PASS (natural, manual, private metadata, failure).');
})().catch(error => { console.error(error); process.exitCode = 1; });
