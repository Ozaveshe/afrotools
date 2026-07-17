const assert = require('assert');

function loadScheduledProof(setData) {
  const dataStorePath = require.resolve('../netlify/functions/_shared/data-store');
  const scheduledProofPath = require.resolve('../netlify/functions/_shared/scheduled-proof');

  delete require.cache[scheduledProofPath];
  require.cache[dataStorePath] = {
    id: dataStorePath,
    filename: dataStorePath,
    loaded: true,
    exports: { setData },
  };

  return require('../netlify/functions/_shared/scheduled-proof');
}

function assertIsoDate(value, label) {
  assert.strictEqual(typeof value, 'string', label + ' should be a string');
  assert.ok(!Number.isNaN(Date.parse(value)), label + ' should be ISO date-like');
}

async function run() {
  const writes = [];
  const scheduleEvent = { headers: { 'x-nf-event': 'schedule' } };
  const scheduledProof = loadScheduledProof(async (key, data) => {
    writes.push({ key, data });
    return true;
  });

  assert.strictEqual(
    scheduledProof.proofKey('Send Weekly Newsletter'),
    'scheduled-proof-send-weekly-newsletter',
    'proof keys should normalize function names for live_data_store'
  );

  assert.strictEqual(
    scheduledProof.proofKey(''),
    'scheduled-proof-unknown',
    'missing function names should use a stable fallback key'
  );

  assert.strictEqual(
    scheduledProof.shouldRecordScheduledProof(scheduleEvent),
    true,
    'Netlify scheduled events should be eligible for scheduled proof writes'
  );

  assert.strictEqual(
    scheduledProof.shouldRecordScheduledProof({ headers: {} }),
    false,
    'Manual calls should not be eligible for scheduled proof writes'
  );

  const okHandler = scheduledProof.withScheduledProof('demo-job', async () => ({
    statusCode: 200,
    body: 'ok',
  }));
  const okResponse = await okHandler(scheduleEvent, {});
  assert.deepStrictEqual(okResponse, { statusCode: 200, body: 'ok' });
  assert.strictEqual(writes[0].key, 'scheduled-proof-demo-job');
  assert.strictEqual(writes[0].data.function_name, 'demo-job');
  assert.strictEqual(writes[0].data.trigger, 'netlify-schedule');
  assert.strictEqual(writes[0].data.ok, true);
  assert.strictEqual(writes[0].data.status, 'ok');
  assert.strictEqual(writes[0].data.status_code, 200);
  assertIsoDate(writes[0].data.checked_at, 'checked_at');
  assertIsoDate(writes[0].data.started_at, 'started_at');
  assert.strictEqual(typeof writes[0].data.duration_ms, 'number');
  assert.ok(!Object.prototype.hasOwnProperty.call(writes[0].data, 'body'));

  const manualHandler = scheduledProof.withScheduledProof('manual-job', async () => ({ statusCode: 200 }));
  const manualResponse = await manualHandler({ headers: {} }, {});
  assert.deepStrictEqual(manualResponse, { statusCode: 200 });
  assert.strictEqual(writes.length, 1, 'manual invocations must not update scheduled proof rows');

  const manualThrowingHandler = scheduledProof.withScheduledProof('manual-throwing-job', async () => {
    throw new Error('manual path failed');
  });
  await assert.rejects(() => manualThrowingHandler({ headers: {} }, {}), /manual path failed/);
  assert.strictEqual(writes.length, 1, 'manual failures must not update scheduled proof rows');

  const degradedHandler = scheduledProof.withScheduledProof('degraded-job', async () => ({ statusCode: 404 }));
  await degradedHandler(scheduleEvent, {});
  assert.strictEqual(writes[1].key, 'scheduled-proof-degraded-job');
  assert.strictEqual(writes[1].data.ok, true);
  assert.strictEqual(writes[1].data.status, 'degraded');
  assert.strictEqual(writes[1].data.status_code, 404);

  const failedResponseHandler = scheduledProof.withScheduledProof('failed-response-job', async () => ({ statusCode: 503 }));
  await failedResponseHandler(scheduleEvent, {});
  assert.strictEqual(writes[2].key, 'scheduled-proof-failed-response-job');
  assert.strictEqual(writes[2].data.ok, false);
  assert.strictEqual(writes[2].data.status, 'failed');
  assert.strictEqual(writes[2].data.status_code, 503);

  const throwingHandler = scheduledProof.withScheduledProof('throwing-job', async () => {
    throw new Error('upstream failed: Bearer secret-token apikey=abc123');
  });

  await assert.rejects(() => throwingHandler(scheduleEvent, {}), /upstream failed/);
  assert.strictEqual(writes[3].key, 'scheduled-proof-throwing-job');
  assert.strictEqual(writes[3].data.ok, false);
  assert.strictEqual(writes[3].data.status, 'failed');
  assert.strictEqual(writes[3].data.status_code, 500);
  assert.match(writes[3].data.error, /Bearer \[redacted\]/);
  assert.match(writes[3].data.error, /apikey=\[redacted\]/);
  assert.ok(!writes[3].data.error.includes('secret-token'));
  assert.ok(!writes[3].data.error.includes('abc123'));

  const writeFailureScheduledProof = loadScheduledProof(async () => {
    throw new Error('write failed with Bearer store-secret');
  });
  const originalConsoleError = console.error;
  const errors = [];
  console.error = (message) => errors.push(String(message));
  try {
    const writeFailureHandler = writeFailureScheduledProof.withScheduledProof('write-failure-job', async () => ({
      statusCode: 200,
    }));
    const writeFailureResponse = await writeFailureHandler(scheduleEvent, {});
    assert.deepStrictEqual(writeFailureResponse, { statusCode: 200 });
  } finally {
    console.error = originalConsoleError;
  }
  assert.strictEqual(errors.length, 1);
  assert.match(errors[0], /Bearer \[redacted\]/);
  assert.ok(!errors[0].includes('store-secret'));
}

run()
  .then(() => {
    console.log('scheduled-proof: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
