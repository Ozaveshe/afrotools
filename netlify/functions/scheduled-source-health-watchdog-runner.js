'use strict';

const { scheduledHandler } = require('./scheduled-source-health-watchdog');

exports.handler = function(event) {
  return scheduledHandler(event || {});
};
