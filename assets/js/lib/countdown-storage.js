(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.countdownStorage = api; }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  function validate(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.name !== 'string' ||
        typeof item.date !== 'string' || (item.time !== undefined && typeof item.time !== 'string')) throw new Error('Invalid saved event');
    var date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.date), time = /^(\d{2}):(\d{2})$/.exec(item.time || '00:00');
    if (!date || !time || +date[1] < 1 || +date[2] < 1 || +date[2] > 12 || +date[3] < 1 || +time[1] > 23 || +time[2] > 59) throw new Error('Invalid saved event date');
    var calendar = new Date(0); calendar.setUTCFullYear(+date[1], +date[2] - 1, +date[3]);
    if (calendar.getUTCMonth() !== +date[2] - 1 || calendar.getUTCDate() !== +date[3]) throw new Error('Invalid saved event date');
    return { name: item.name, date: item.date, time: item.time || '00:00' };
  }
  function create(options) {
    var key = 'afro_countdowns', notify = options.onStatus || function () {}, blocked = false;
    function storage() { return typeof options.storage === 'function' ? options.storage() : options.storage; }
    function read() {
      if (blocked) return null;
      try {
        var raw = storage().getItem(key), rows = raw === null ? [] : JSON.parse(raw);
        if (!Array.isArray(rows)) throw new Error('Invalid saved event list');
        return rows.map(validate);
      } catch (error) { blocked = true; notify('loadError'); return null; }
    }
    function write(rows) {
      try { storage().setItem(key, JSON.stringify(rows)); notify('saved'); return true; }
      catch (error) { notify('saveError'); return false; }
    }
    function add(item) {
      var normalized;
      try { normalized = validate(item); }
      catch (error) { notify('invalid'); return false; }
      var rows = read(); if (!rows) return false;
      rows.push(normalized); return write(rows.slice(-10));
    }
    function remove(index, expected) {
      var rows = read(); if (!rows || !Number.isInteger(index) || index < 0 || index >= rows.length) return false;
      if (expected && JSON.stringify(rows[index]) !== JSON.stringify(validate(expected))) { notify('changed'); return false; }
      rows.splice(index, 1); return write(rows);
    }
    function clear() {
      try { storage().removeItem(key); blocked = false; notify('cleared'); return true; }
      catch (error) { notify('clearError'); return false; }
    }
    return { read: read, add: add, remove: remove, clear: clear };
  }
  return { validate: validate, create: create };
});
