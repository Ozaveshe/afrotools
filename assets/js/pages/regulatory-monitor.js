(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../lib/regulatory-public-feed.js'));
  else root.RegulatoryMonitor = factory(root.RegulatoryPublicFeed);
}(typeof window !== 'undefined' ? window : this, function (publicFeed) {
  'use strict';
  // This fixed first-party public dataset has no relationship to private review state.
  var FEED_PATH = '/data/regulatory/public-feed.json';
  function createLoader(options) {
    var pending = null;
    var setTimer = options.setTimeout || setTimeout, clearTimer = options.clearTimeout || clearTimeout;
    var Abort = options.AbortController || AbortController;
    function state(kind, message, rows) {
      var result = {kind:kind, message:message, records:rows || []};
      options.onState(result);
      return result;
    }
    async function run() {
      state('loading', 'Loading the public change feed…');
      if (options.isOnline && !options.isOnline()) return state('offline', 'You are offline. Public changes cannot be checked. Reconnect, then retry.');
      var transport = options.fetch || (typeof fetch === 'function' ? fetch : null);
      if (!transport || !publicFeed) return state('unavailable', 'The public feed controls are unavailable. Reload this page to try again.');
      var controller = new Abort(), timer;
      try {
        var operation = Promise.resolve().then(async function () {
          var response = await transport(FEED_PATH, {method:'GET', credentials:'omit',
            cache:'no-cache', redirect:'error', signal:controller.signal, headers:{Accept:'application/json'}});
          if (!response || !response.ok || !response.headers ||
              !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('public-feed-unavailable');
          var declared = response.headers.get('content-length');
          if (declared && (!/^\d+$/.test(declared) || Number(declared) > publicFeed.MAX_BYTES)) throw new Error('public-feed-size');
          var body = await response.text();
          if (new TextEncoder().encode(body).byteLength > publicFeed.MAX_BYTES) throw new Error('public-feed-size');
          return publicFeed.validateFeed(JSON.parse(body), options.engine, options.now ? options.now() : Date.now());
        });
        var feed = await Promise.race([operation, new Promise(function (_, reject) {
          timer = setTimer(function () { reject(new Error('public-feed-timeout')); controller.abort(); }, 8000);
        })]);
        if (!feed.records.length) return state('empty', 'No published records are included in this selected-event feed. This does not mean no regulations have changed.');
        var rows = feed.records.map(function (r) {
          var primary = r.sources.filter(function (s) { return s.kind === 'primary'; })[0];
          return {id:r.id, country_code:r.country_code, change_type:r.change_type,
            title:r.title, summary:r.summary, effective_date:r.effective_date,
            reviewed_at:r.reviewed_at, source_published_date:r.source_published_date,
            source_url:primary.url, source_name:primary.publisher,
            corroborating_sources:r.sources.filter(function (s) { return s.kind === 'corroboration'; }),
            tools_affected:r.tools_referenced, verified:true, status:r.status,
            superseded_by:r.superseded_by, correction_note:r.correction_note,
            review_due:r.review_due, review_due_at:r.review_due_at};
        });
        var overdue = rows.filter(function (r) { return r.review_due; }).length;
        return state('ready', 'Showing ' + rows.length + ' selected historical event' + (rows.length === 1 ? '' : 's') +
          ' in ' + feed.coverage.countries.length + ' countr' + (feed.coverage.countries.length === 1 ? 'y' : 'ies') +
          '. This editorial list is not comprehensive or current-law monitoring; check each official source and effective date.' +
          (overdue ? ' ' + overdue + ' record(s) are due for source review.' : ''), rows);
      } catch (_) {
        return state('unavailable', 'The public change feed could not be loaded. Its current contents and country coverage are unknown. Retry or consult an official source directly.');
      } finally {
        clearTimer(timer);
        controller.abort();
      }
    }
    return {load:function () {
      if (!pending) pending = run().finally(function () { pending = null; });
      return pending;
    }};
  }
  return {createLoader:createLoader};
}));
