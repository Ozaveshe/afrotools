'use strict';

const { connectLambda } = require('@netlify/blobs');

module.exports = function connectDataBlobs(event) {
  // Modern runtimes provide ambient context. Lambda-compatible invocations
  // carry a platform-owned field on the event, outside its request body.
  if (!event || typeof event.blobs !== 'string') return;
  try {
    connectLambda(event);
  } catch {
    // Keep the primary and static fallback usable without logging event data.
    console.warn('[data-store] Netlify Blobs invocation context could not be initialized');
  }
};
