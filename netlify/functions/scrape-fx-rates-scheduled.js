'use strict';

const { scheduledHandler } = require('./scrape-fx-rates');

exports.handler = function(event) {
  return scheduledHandler(event || {});
};
