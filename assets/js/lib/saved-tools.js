/**
 * Saved Tools — /api/favorites for logged-in users, localStorage as fallback
 *
 * Usage on any tool page:
 *   const saved = new SavedTools();
 *   await saved.save('ng-paye', 'Nigeria PAYE Calculator', '/nigeria/ng-salary-tax/', '🇳🇬');
 *   await saved.remove('ng-paye');
 *   const tools = await saved.getAll();
 *   const isSaved = await saved.isSaved('ng-paye');
 */
(function () {
  'use strict';

  var LOCAL_KEY = 'afro_favs_v2'; // unified with existing system

  function _getToken() {
    if (!window.AfroAuth) return null;
    if (AfroAuth.getSessionToken) return AfroAuth.getSessionToken();
    // Fallback: read directly from localStorage
    try {
      var stored = localStorage.getItem('sb-zpclagtgczsygrgztlts-auth-token');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.access_token) return parsed.access_token;
      }
    } catch (e) {}
    return null;
  }

  function _loggedIn() {
    return window.AfroAuth && AfroAuth.isLoggedIn && AfroAuth.isLoggedIn();
  }

  async function _apiFetch(url, options) {
    var token;
    if (window.AfroAuth && AfroAuth.getSessionTokenAsync) {
      token = await AfroAuth.getSessionTokenAsync();
    } else {
      token = _getToken();
    }
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
      console.warn('[SavedTools] API error:', e);
      return null;
    }
  }

  function SavedTools() {
    this._ready = false;
    this._readyPromise = this._init();
  }

  SavedTools.prototype._init = function () {
    var self = this;
    return new Promise(function (resolve) {
      function connectAuth() {
        window.AfroAuth.onReady(function () {
          if (window.AfroAuth.isLoggedIn()) {
            // Migrate localStorage favorites to API on first login
            self._migrateLocalToCloud().then(function () {
              self._ready = true;
              resolve();
            });
          } else {
            self._ready = true;
            resolve();
          }
        });
      }

      if (window.AfroAuth && typeof window.AfroAuth.onReady === 'function') {
        connectAuth();
      } else {
        var attempts = 0;
        var poll = setInterval(function () {
          attempts++;
          if (window.AfroAuth && typeof window.AfroAuth.onReady === 'function') {
            clearInterval(poll);
            connectAuth();
          } else if (attempts >= 40) {
            clearInterval(poll);
            self._ready = true;
            resolve();
          }
        }, 200);
      }

      setTimeout(function () {
        if (!self._ready) {
          self._ready = true;
          resolve();
        }
      }, 10000);
    });
  };

  SavedTools.prototype._ensureReady = function () {
    return this._readyPromise;
  };

  // ── SAVE ──────────────────────────────────────────────
  SavedTools.prototype.save = async function (slug) {
    await this._ensureReady();

    if (_loggedIn()) {
      var result = await _apiFetch('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ tool_id: slug })
      });
      if (result && result.saved) {
        this._addLocal(slug);
        return;
      }
    }

    // Fallback: localStorage only
    this._addLocal(slug);
  };

  // ── REMOVE ────────────────────────────────────────────
  SavedTools.prototype.remove = async function (slug) {
    await this._ensureReady();

    if (_loggedIn()) {
      await _apiFetch('/api/favorites?tool_id=' + encodeURIComponent(slug), {
        method: 'DELETE'
      });
    }

    this._removeLocal(slug);
  };

  // ── GET ALL ───────────────────────────────────────────
  SavedTools.prototype.getAll = async function () {
    await this._ensureReady();

    if (_loggedIn()) {
      var result = await _apiFetch('/api/favorites');
      if (result && result.data) {
        return result.data.map(function (d) {
          return { slug: d.tool_id, savedAt: d.created_at };
        });
      }
    }

    // Fallback: localStorage
    var local = this._getLocal();
    return local.map(function (slug) {
      return { slug: slug, savedAt: null };
    });
  };

  // ── IS SAVED ──────────────────────────────────────────
  SavedTools.prototype.isSaved = async function (slug) {
    // Fast local check first
    if (this._getLocal().indexOf(slug) >= 0) return true;

    // If logged in, check via API
    if (_loggedIn()) {
      var all = await this.getAll();
      return all.some(function (item) { return item.slug === slug; });
    }

    return false;
  };

  // ── TOGGLE (convenience) ──────────────────────────────
  SavedTools.prototype.toggle = async function (slug) {
    var saved = await this.isSaved(slug);
    if (saved) {
      await this.remove(slug);
      return false;
    } else {
      await this.save(slug);
      return true;
    }
  };

  // ── CLEAR ALL ─────────────────────────────────────────
  SavedTools.prototype.clearAll = async function () {
    await this._ensureReady();
    // Clear local only — API doesn't support bulk delete
    localStorage.setItem(LOCAL_KEY, JSON.stringify([]));
  };

  // ── COUNT ─────────────────────────────────────────────
  SavedTools.prototype.count = function () {
    return this._getLocal().length;
  };

  // ── MIGRATE LOCAL TO CLOUD ────────────────────────────
  SavedTools.prototype._migrateLocalToCloud = async function () {
    if (!_loggedIn()) return;

    var local = this._getLocal();
    if (local.length === 0) return;

    try {
      // Save each local favorite via API
      for (var i = 0; i < local.length; i++) {
        await _apiFetch('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ tool_id: local[i] })
        });
      }
      console.log('[SavedTools] Migrated ' + local.length + ' favorites to cloud');
    } catch (e) {
      console.warn('[SavedTools] Migration failed:', e);
    }
  };

  // ── LOCAL STORAGE HELPERS ─────────────────────────────
  SavedTools.prototype._getLocal = function () {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
    catch (e) { return []; }
  };

  SavedTools.prototype._addLocal = function (slug) {
    var favs = this._getLocal();
    if (favs.indexOf(slug) >= 0) return;
    favs.unshift(slug);
    if (favs.length > 50) favs = favs.slice(0, 50);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favs));
  };

  SavedTools.prototype._removeLocal = function (slug) {
    var favs = this._getLocal().filter(function (f) { return f !== slug; });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favs));
  };

  // ── BACKWARD COMPAT: sync afroFavs API ────────────────
  var _instance = new SavedTools();

  window.afroFavs = {
    getAll: function () { return _instance._getLocal(); },
    has: function (id) { return _instance._getLocal().indexOf(id) >= 0; },
    toggle: function (id) {
      var favs = _instance._getLocal();
      if (favs.indexOf(id) >= 0) {
        _instance.remove(id);
        return false;
      } else {
        _instance.save(id);
        return true;
      }
    },
    count: function () { return _instance._getLocal().length; }
  };

  // Export class for direct use
  window.SavedTools = SavedTools;
  window._savedToolsInstance = _instance;

})();
