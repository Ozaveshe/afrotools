'use strict';

const fs = require('fs');

const PATCH_MARK = Symbol.for('afrotools.buildSafeFs');
const RETRYABLE_CODES = new Set(['EBUSY', 'EPERM', 'UNKNOWN']);
const MAX_ATTEMPTS = Number(process.env.AFROTOOLS_SAFE_WRITE_ATTEMPTS || 240);
const MAX_DELAY_MS = Number(process.env.AFROTOOLS_SAFE_WRITE_DELAY_MS || 500);

function waitSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function withRetry(operation) {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      if (!error || !RETRYABLE_CODES.has(error.code) || attempt === MAX_ATTEMPTS - 1) {
        throw error;
      }
      waitSync(Math.min(MAX_DELAY_MS, 75 * (attempt + 1)));
    }
  }
  throw lastError;
}

function patchSyncMethod(methodName) {
  const original = fs[methodName].bind(fs);
  fs[methodName] = (...args) => withRetry(() => original(...args));
}

if (!fs[PATCH_MARK]) {
  Object.defineProperty(fs, PATCH_MARK, { value: true });
  patchSyncMethod('writeFileSync');
  patchSyncMethod('renameSync');
  patchSyncMethod('unlinkSync');
}
