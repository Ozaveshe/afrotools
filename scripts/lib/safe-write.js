"use strict";

const fs = require("fs");

const RETRYABLE_WRITE_CODES = new Set(["EBUSY", "EPERM", "UNKNOWN"]);

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
      waitSync(75 * (attempt + 1));
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
    20
  );
}

function renameSyncWithRetry(fromPath, toPath) {
  return retrySync(
    () => fs.renameSync(fromPath, toPath),
    isRetryableWriteError,
    20
  );
}

module.exports = {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
};
