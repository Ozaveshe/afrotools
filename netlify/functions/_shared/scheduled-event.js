'use strict';

function getHeader(event, headerName) {
  var headers = event && event.headers ? event.headers : {};
  var expected = String(headerName || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i]).toLowerCase() === expected) return headers[keys[i]];
  }
  return '';
}

function isScheduledEvent(event) {
  return String(getHeader(event, 'x-nf-event')).toLowerCase() === 'schedule';
}

module.exports = {
  isScheduledEvent,
};
