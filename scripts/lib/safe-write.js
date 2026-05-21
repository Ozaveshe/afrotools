"use strict";

const fs = require("fs");

const RETRYABLE_WRITE_CODES = new Set(["EBUSY", "EPERM", "UNKNOWN"]);
const MAX_WRITE_ATTEMPTS = Number(process.env.AFROTOOLS_SAFE_WRITE_ATTEMPTS || 240);
const MAX_RETRY_DELAY_MS = Number(process.env.AFROTOOLS_SAFE_WRITE_DELAY_MS || 500);

function waitSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function retrySync(action, shouldRetry, maxAttempts) {
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return action();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === maxAttempts - 1) throw error;
      waitSync(Math.min(MAX_RETRY_DELAY_MS, 75 * (attempt + 1)));
    }
  }
  throw lastError;
}

function isRetryableWriteError(error) {
  return Boolean(error && RETRYABLE_WRITE_CODES.has(error.code));
}

function writeFileSyncWithRetry(filePath, data, encoding) {
  return retrySync(
    () => fs.writeFileSync(filePath, data, encoding),
    isRetryableWriteError,
    MAX_WRITE_ATTEMPTS
  );
}

function renameSyncWithRetry(fromPath, toPath) {
  return retrySync(
    () => fs.renameSync(fromPath, toPath),
    isRetryableWriteError,
    MAX_WRITE_ATTEMPTS
  );
}

module.exports = {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
};
