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
  if (String(getHeader(event, 'x-nf-event')).toLowerCase() === 'schedule') return true;

  // Netlify's current scheduled-function contract sends a JSON body with the
  // next scheduled invocation. Scheduled functions are not directly
  // invokable by URL in production, so this platform payload is authoritative.
  try {
    var payload = JSON.parse(event && event.body ? event.body : '{}');
    return !!payload && typeof payload.next_run === 'string' &&
      Number.isFinite(Date.parse(payload.next_run));
  } catch (_error) {
    return false;
  }
}

module.exports = {
  isScheduledEvent,
};
