(function (root) {
  'use strict';
  var key = 'afro_pro_return_route_v1';
  function safe(value, origin) {
    origin = origin || (root.location && root.location.origin) || 'https://afrotools.com';
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value)) return '/pro/workspace/';
    try {
      var url = new URL(value, origin);
      if (url.origin !== origin || !/^\/pro\/(?:apps\/(?:[a-z0-9-]+\/)?|workspace\/|vault\/|team\/|settings\/(?:billing\/)?|)?$/.test(url.pathname)) return '/pro/workspace/';
      var params = new URLSearchParams();
      ['tab', 'view', 'country', 'currency', 'period'].forEach(function (name) {
        var val = url.searchParams.get(name);
        if (val && /^[a-zA-Z0-9_-]{1,40}$/.test(val)) params.set(name, val);
      });
      var hash = /^#[a-zA-Z0-9_-]{1,60}$/.test(url.hash) ? url.hash : '';
      return url.pathname + (params.size ? '?' + params : '') + hash;
    } catch (err) { return '/pro/workspace/'; }
  }
  function remember(value) {
    var route = safe(value);
    try { root.sessionStorage.setItem(key, route); } catch (err) {}
    return route;
  }
  function current() {
    var query = new URLSearchParams(root.location.search).get('next');
    if (query) return remember(query);
    try { return safe(root.sessionStorage.getItem(key)); } catch (err) { return '/pro/workspace/'; }
  }
  var api = { safe: safe, remember: remember, current: current };
  root.AfroProReturn = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
