(function (window) {
  'use strict';

  var HISTORY_EVENT = 'afro-history-change';
  var FALLBACK_SUPABASE_KEY = 'sb-zpclagtgczsygrgztlts-auth-token';

  function dispatchHistoryChange(detail) {
    try {
      window.dispatchEvent(new CustomEvent(HISTORY_EVENT, {
        detail: detail || {}
      }));
    } catch (error) {
      // Ignore custom event issues in older browsers.
    }
  }

  function hasAuthIdentity() {
    if (!window.AfroAuth) return false;

    try {
      if (typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn()) {
        return true;
      }
    } catch (error) {
      console.warn('[AfroHistory] isLoggedIn check failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getUser === 'function') {
        var user = window.AfroAuth.getUser();
        if (user && user.id) return true;
      }
    } catch (error) {
      console.warn('[AfroHistory] getUser fallback failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getCachedProfile === 'function') {
        var cachedProfile = window.AfroAuth.getCachedProfile();
        if (cachedProfile && cachedProfile.id) return true;
      }
    } catch (error) {
      console.warn('[AfroHistory] getCachedProfile fallback failed:', error);
    }

    return false;
  }

  async function getSessionToken() {
    if (!window.AfroAuth) return null;

    if (typeof window.AfroAuth.getSessionTokenAsync === 'function') {
      try {
        var asyncToken = await window.AfroAuth.getSessionTokenAsync();
        if (asyncToken) return asyncToken;
      } catch (error) {
        console.warn('[AfroHistory] async token lookup failed:', error);
      }
    }

    if (typeof window.AfroAuth.getSupabase === 'function') {
      try {
        var supabase = window.AfroAuth.getSupabase();
        if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
          var sessionResult = await supabase.auth.getSession();
          if (
            sessionResult &&
            sessionResult.data &&
            sessionResult.data.session &&
            sessionResult.data.session.access_token
          ) {
            return sessionResult.data.session.access_token;
          }
        }
      } catch (error) {
        console.warn('[AfroHistory] Supabase session lookup failed:', error);
      }
    }

    if (typeof window.AfroAuth.getSessionToken === 'function') {
      try {
        var syncToken = window.AfroAuth.getSessionToken();
        if (syncToken) return syncToken;
      } catch (error) {
        console.warn('[AfroHistory] sync token lookup failed:', error);
      }
    }

    try {
      var fallbackSession = JSON.parse(localStorage.getItem(FALLBACK_SUPABASE_KEY) || 'null');
      if (fallbackSession && fallbackSession.access_token) {
        return fallbackSession.access_token;
      }
    } catch (error) {
      console.warn('[AfroHistory] fallback token lookup failed:', error);
    }

    return null;
  }

  async function request(path, options) {
    var token = await getSessionToken();
    if (!token) return null;

    var requestOptions = options || {};
    requestOptions.headers = Object.assign(
      {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      requestOptions.headers || {}
    );

    try {
      var response = await fetch(path, requestOptions);
      return await response.json();
    } catch (error) {
      console.warn('[AfroHistory] API error:', error);
      return null;
    }
  }

  window.AfroHistory = {
    save: async function (entry) {
      if (!hasAuthIdentity()) {
        return { saved: false, reason: 'not_logged_in' };
      }

      var result = await request('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          tool_slug: entry.toolSlug,
          tool_name: entry.toolName,
          country_code: entry.countryCode || null,
          currency: entry.currency || null,
          inputs: entry.inputs,
          outputs: entry.outputs
        })
      }) || { saved: false, reason: 'network_error' };

      if (result.saved) {
        dispatchHistoryChange({
          action: 'save',
          toolSlug: entry.toolSlug || '',
          toolName: entry.toolName || ''
        });
      }

      return result;
    },

    getRecent: async function (limit) {
      if (!hasAuthIdentity()) return [];
      var response = await request('/api/history?limit=' + (limit || 10));
      return (response && response.data) || [];
    },

    getByTool: async function (toolSlug, limit) {
      if (!hasAuthIdentity()) return [];
      var response = await request('/api/history?tool=' + encodeURIComponent(toolSlug) + '&limit=' + (limit || 20));
      return (response && response.data) || [];
    },

    delete: async function (id) {
      if (!hasAuthIdentity()) {
        return { deleted: false, error: 'Not logged in' };
      }

      var result = await request('/api/history?id=' + encodeURIComponent(id), {
        method: 'DELETE'
      }) || { deleted: false, error: 'Network error' };

      if (result.deleted === true) {
        dispatchHistoryChange({
          action: 'delete',
          id: id
        });
      }

      return result;
    },

    getMonthlyCount: async function () {
      if (!hasAuthIdentity()) {
        return { count: 0, limit: 5, tier: 'free' };
      }

      var recentItems = await this.getRecent(100);
      var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      var currentMonthCount = recentItems.filter(function (item) {
        return new Date(item.created_at) >= monthStart;
      }).length;
      var isPro = window.AfroAuth && typeof window.AfroAuth.isPro === 'function' && window.AfroAuth.isPro();

      return {
        count: currentMonthCount,
        limit: isPro ? Infinity : 5,
        tier: isPro ? 'pro' : 'free'
      };
    }
  };
})(window);
