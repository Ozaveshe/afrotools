'use strict';

const { setData } = require('./data-store');
const { isScheduledEvent } = require('./scheduled-event');

function proofKey(functionName) {
  return 'scheduled-proof-' + String(functionName || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeError(error) {
  return String(error && error.message ? error.message : error || 'Unknown error')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/apikey["']?\s*[:=]\s*["']?[A-Za-z0-9._-]+/gi, 'apikey=[redacted]')
    .slice(0, 220);
}

async function recordScheduledProof(functionName, details) {
  const payload = Object.assign({
    function_name: String(functionName || 'unknown'),
    checked_at: new Date().toISOString(),
    trigger: 'netlify-schedule',
  }, details || {});

  try {
    return await setData(proofKey(functionName), payload);
  } catch (error) {
    console.error('[scheduled-proof] Failed for ' + functionName + ': ' + sanitizeError(error));
    return false;
  }
}

function statusFromResponse(response) {
  const statusCode = Number(response && response.statusCode) || 200;
  if (statusCode >= 500) return 'failed';
  if (statusCode >= 400) return 'degraded';
  return 'ok';
}

function shouldRecordScheduledProof(event) {
  return isScheduledEvent(event);
}

function withScheduledProof(functionName, handler) {
  return async function scheduledProofWrappedHandler(event, context) {
    const startedAt = new Date();
    try {
      const response = await handler(event, context);
      const statusCode = Number(response && response.statusCode) || 200;
      if (shouldRecordScheduledProof(event)) {
        await recordScheduledProof(functionName, {
          ok: statusCode < 500,
          status: statusFromResponse(response),
          status_code: statusCode,
          started_at: startedAt.toISOString(),
          duration_ms: Date.now() - startedAt.getTime(),
        });
      }
      return response;
    } catch (error) {
      if (shouldRecordScheduledProof(event)) {
        await recordScheduledProof(functionName, {
          ok: false,
          status: 'failed',
          status_code: 500,
          started_at: startedAt.toISOString(),
          duration_ms: Date.now() - startedAt.getTime(),
          error: sanitizeError(error),
        });
      }
      throw error;
    }
  };
}

module.exports = {
  proofKey,
  recordScheduledProof,
  shouldRecordScheduledProof,
  withScheduledProof,
};
