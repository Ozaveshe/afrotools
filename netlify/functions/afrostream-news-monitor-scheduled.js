'use strict';

// Netlify's schedule boundary, rather than caller-controlled headers or JSON,
// is the trust boundary for this invocation.
const { scheduledHandler } = require('./afrostream-news-monitor');

exports.handler = function(event) {
  return scheduledHandler(event || {});
};
