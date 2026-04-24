(function (window) {
  'use strict';

  var API_PATH = '/api/workspace';
  var AUTH_STORAGE_KEY = 'afro_auth_v2';
  var SESSION_STORAGE_KEY = 'afro_session_v3';
  var PROFILE_CACHE_KEY = 'afro_profile_cache';
  var CHANGE_EVENT = 'afro-workspace-change';

  function dispatchWorkspaceEvent(detail) {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: detail || {} }));
    } catch (error) {
      // Ignore event dispatch errors in older browsers.
    }
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function readJson(key, fallback) {
    try {
      return safeJsonParse(localStorage.getItem(key), fallback);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function readText(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null || value === undefined ? (fallback || '') : value;
    } catch (error) {
      return fallback || '';
    }
  }

  function writeText(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getCachedUser() {
    if (window.AfroAuth && typeof window.AfroAuth.getUser === 'function') {
      var authUser = window.AfroAuth.getUser();
      if (authUser && authUser.id) return authUser;
    }

    if (window.AfroAuth && typeof window.AfroAuth.getCachedProfile === 'function') {
      try {
        var cachedProfile = window.AfroAuth.getCachedProfile();
        if (cachedProfile && cachedProfile.id) return cachedProfile;
      } catch (error) {
        console.warn('[WorkspaceSync] getCachedProfile lookup failed:', error.message || error);
      }
    }

    var user = readJson(AUTH_STORAGE_KEY, null);
    if (user && user.id) return user;

    var profile = readJson(PROFILE_CACHE_KEY, null);
    if (profile && profile.user && profile.user.id) return profile.user;

    return null;
  }

  function getSessionTokenSync() {
    if (window.AfroAuth && typeof window.AfroAuth.getSessionToken === 'function') {
      return window.AfroAuth.getSessionToken();
    }

    return readText(SESSION_STORAGE_KEY, '');
  }

  async function getSessionTokenAsync() {
    if (window.AfroAuth && typeof window.AfroAuth.getSessionTokenAsync === 'function') {
      try {
        var asyncToken = await window.AfroAuth.getSessionTokenAsync();
        if (asyncToken) return asyncToken;
      } catch (error) {
        console.warn('[WorkspaceSync] Async session token lookup failed:', error.message || error);
      }
    }

    if (window.AfroAuth && typeof window.AfroAuth.getSupabase === 'function') {
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
        console.warn('[WorkspaceSync] Supabase session lookup failed:', error.message || error);
      }
    }

    return getSessionTokenSync();
  }

  function isSignedIn() {
    var user = getCachedUser();
    return !!(user && user.id);
  }

  function buildQuery(query) {
    if (!query) return '';

    var params = new URLSearchParams();
    Object.keys(query).forEach(function (key) {
      var value = query[key];
      if (value === null || value === undefined || value === '') return;

      if (Array.isArray(value)) {
        if (!value.length) return;
        params.set(key, value.join(','));
        return;
      }

      params.set(key, String(value));
    });

    var serialized = params.toString();
    return serialized ? '?' + serialized : '';
  }

  async function request(method, options) {
    var requestOptions = options || {};
    var token = await getSessionTokenAsync();

    if (!token && !isSignedIn()) {
      throw new Error('Not signed in');
    }

    var headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    var response = await fetch(API_PATH + buildQuery(requestOptions.query), {
      method: method,
      credentials: 'same-origin',
      headers: headers,
      body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
    });

    var text = await response.text();
    var data = null;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = { error: text || 'Invalid JSON response' };
    }

    if (!response.ok) {
      throw new Error((data && (data.error || data.detail)) || ('Workspace request failed (' + response.status + ')'));
    }

    return data || {};
  }

  async function list(options) {
    var config = options || {};
    var query = {};

    if (config.id) query.id = config.id;
    if (config.itemType) query.item_type = config.itemType;
    if (config.itemKey) query.item_key = config.itemKey;
    if (config.itemTypes) query.types = config.itemTypes;
    if (config.limit) query.limit = config.limit;
    if (config.withPayload === false) query.summary = 1;

    var data = await request('GET', { query: query });
    return Array.isArray(data.data) ? data.data : [];
  }

  async function get(itemType, itemKey) {
    var items = await list({
      itemType: itemType,
      itemKey: itemKey,
      limit: 1,
    });

    return items[0] || null;
  }

  async function upsert(item) {
    var record = item || {};
    if (!record.itemType || !record.itemKey) {
      throw new Error('itemType and itemKey are required');
    }

    var response = await request('POST', {
      body: {
        item_type: record.itemType,
        item_key: record.itemKey,
        tool_slug: record.toolSlug || '',
        title: record.title || 'Untitled item',
        summary: record.summary || '',
        href: record.href || '',
        payload: record.payload || {},
        meta: record.meta || {},
      },
    });

    dispatchWorkspaceEvent({
      action: 'upsert',
      itemType: record.itemType,
      itemKey: record.itemKey,
      item: response.item || null,
    });

    return response.item || null;
  }

  async function remove(options) {
    var config = options || {};
    if (!config.id && (!config.itemType || !config.itemKey)) {
      throw new Error('id or itemType/itemKey is required');
    }

    var response = await request('DELETE', {
      query: {
        id: config.id || '',
        item_type: config.itemType || '',
        item_key: config.itemKey || '',
      },
    });

    dispatchWorkspaceEvent({
      action: 'delete',
      id: config.id || '',
      itemType: config.itemType || '',
      itemKey: config.itemKey || '',
      item: response.item || null,
    });

    return response.item || null;
  }

  function getTimestamp(value) {
    if (!value) return 0;

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    var parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function summarizeText(text, maxLength) {
    var cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength - 3).trim() + '...';
  }

  window.AfroWorkspace = {
    apiPath: API_PATH,
    changeEvent: CHANGE_EVENT,
    getUser: getCachedUser,
    isSignedIn: isSignedIn,
    getSessionTokenAsync: getSessionTokenAsync,
    list: list,
    get: get,
    upsert: upsert,
    remove: remove,
    readJson: readJson,
    writeJson: writeJson,
    readText: readText,
    writeText: writeText,
    getTimestamp: getTimestamp,
    summarizeText: summarizeText,
    dispatchChange: dispatchWorkspaceEvent,
  };
})(window);
