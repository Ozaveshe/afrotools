'use strict';

// This file is configured as schedule-only in netlify.toml. Keep public/manual
// routing on afrostream-sync.js, whose handler always enforces ADMIN_SECRET.
const { scheduledHandler } = require('./afrostream-sync');

exports.handler = function(event) {
  return scheduledHandler(event || {});
};
