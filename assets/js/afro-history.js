/**
 * AFROTOOLS — Calculation History Module
 * ═══════════════════════════════════════════════════════════
 * Save/load calculation history via /api/history (Netlify function).
 * Uses auth token from AfroAuth for authentication.
 *
 * Usage:
 *   await AfroHistory.save({ toolSlug, toolName, countryCode, currency, inputs, outputs });
 *   await AfroHistory.getRecent(10);
 *   await AfroHistory.getByTool('ng-paye', 20);
 *   await AfroHistory.delete(id);
 * ═══════════════════════════════════════════════════════════
 */
(function (window) {
  'use strict';

  var FREE_LIMIT = 5;

  function _loggedIn() {
    return window.AfroAuth && AfroAuth.isLoggedIn && AfroAuth.isLoggedIn();
  }

  async function _getToken() {
    if (!window.AfroAuth) return null;
    if (AfroAuth.getSessionTokenAsync) return await AfroAuth.getSessionTokenAsync();
    if (AfroAuth.getSessionToken) return AfroAuth.getSessionToken();
    return null;
  }

  async function _apiFetch(url, options) {
    var token = await _getToken();
    if (!token) return null;
    options = options || {};
    options.headers = Object.assign({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }, options.headers || {});
    try {
      var res = await fetch(url, options);
      return await res.json();
    } catch (e) {
      console.warn('[AfroHistory] API error:', e);
      return null;
    }
  }

  window.AfroHistory = {

    save: async function (params) {
      if (!_loggedIn()) return { saved: false, reason: 'not_logged_in' };

      var result = await _apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          tool_slug: params.toolSlug,
          tool_name: params.toolName,
          country_code: params.countryCode || null,
          currency: params.currency || null,
          inputs: params.inputs,
          outputs: params.outputs
        })
      });

      if (!result) return { saved: false, reason: 'network_error' };
      return result;
    },

    getRecent: async function (limit) {
      if (!_loggedIn()) return [];
      var result = await _apiFetch('/api/history?limit=' + (limit || 10));
      return (result && result.data) || [];
    },

    getByTool: async function (toolSlug, limit) {
      if (!_loggedIn()) return [];
      var result = await _apiFetch('/api/history?tool=' + encodeURIComponent(toolSlug) + '&limit=' + (limit || 20));
      return (result && result.data) || [];
    },

    delete: async function (id) {
      if (!_loggedIn()) return { deleted: false, error: 'Not logged in' };
      var result = await _apiFetch('/api/history?id=' + encodeURIComponent(id), { method: 'DELETE' });
      if (!result) return { deleted: false, error: 'Network error' };
      return result;
    },

    getMonthlyCount: async function () {
      if (!_loggedIn()) return { count: 0, limit: FREE_LIMIT, tier: 'free' };
      var recent = await this.getRecent(100);
      var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      var count = recent.filter(function (r) {
        return new Date(r.created_at) >= monthStart;
      }).length;
      var isPro = window.AfroAuth && AfroAuth.isPro && AfroAuth.isPro();
      return {
        count: count,
        limit: isPro ? Infinity : FREE_LIMIT,
        tier: isPro ? 'pro' : 'free'
      };
    }
  };

})(window);
