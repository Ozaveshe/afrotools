'use strict';

const { scheduledHandler } = require('./scheduled-refresh-market-data');

exports.handler = function(event) {
  return scheduledHandler(event || {});
};
