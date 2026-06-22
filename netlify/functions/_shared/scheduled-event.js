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

function parseBody(event) {
  if (!event || !event.body) return null;
  if (typeof event.body === 'object') return event.body;
  try {
    return JSON.parse(event.body);
  } catch (error) {
    return null;
  }
}

function hasNextRunBody(event) {
  var body = parseBody(event);
  return !!(body && typeof body.next_run === 'string' && body.next_run);
}

function isScheduledEvent(event) {
  return getHeader(event, 'x-nf-event') === 'schedule' || hasNextRunBody(event);
}

module.exports = {
  isScheduledEvent,
};
