/**
 * Saved Tools — Supabase for logged-in users, localStorage as fallback
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

  function SavedTools() {
    this._supabase = null;
    this._user = null;
    this._ready = false;
    this._readyPromise = this._init();
  }

  SavedTools.prototype._init = function () {
    var self = this;
    return new Promise(function (resolve) {
      function connectAuth() {
        window.AfroAuth.onReady(function () {
          if (window.AfroAuth.isLoggedIn()) {
            self._user = window.AfroAuth.getUser();
            self._supabase = window.AfroAuth.getSupabase();

            // Migrate localStorage favorites to Supabase on first login
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

      // AfroAuth may not be loaded yet (navbar injects it dynamically).
      // Poll for it instead of giving up immediately.
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
            // 8 seconds — give up, localStorage only
            clearInterval(poll);
            self._ready = true;
            resolve();
          }
        }, 200);
      }

      // Safety timeout — don't block forever (10s absolute max)
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
  SavedTools.prototype.save = async function (slug, name, url, icon) {
    await this._ensureReady();
    icon = icon || '';

    if (this._user && this._supabase) {
      try {
        var res = await this._supabase
          .from('favorites')
          .upsert({
            user_id: this._user.id,
            tool_id: slug
          }, { onConflict: 'user_id,tool_id' });

        if (!res.error) {
          // Also keep in localStorage for offline access
          this._addLocal(slug);
          return;
        }
      } catch (e) {
        console.warn('[SavedTools] Supabase save failed, using localStorage:', e);
      }
    }

    // Fallback: localStorage only
    this._addLocal(slug);
  };

  // ── REMOVE ────────────────────────────────────────────
  SavedTools.prototype.remove = async function (slug) {
    await this._ensureReady();

    if (this._user && this._supabase) {
      try {
        await this._supabase
          .from('favorites')
          .delete()
          .eq('user_id', this._user.id)
          .eq('tool_id', slug);
      } catch (e) {
        console.warn('[SavedTools] Supabase remove failed:', e);
      }
    }

    // Always remove from localStorage too
    this._removeLocal(slug);
  };

  // ── GET ALL ───────────────────────────────────────────
  SavedTools.prototype.getAll = async function () {
    await this._ensureReady();

    if (this._user && this._supabase) {
      try {
        var res = await this._supabase
          .from('favorites')
          .select('tool_id, created_at')
          .eq('user_id', this._user.id)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) {
          return res.data.map(function (d) {
            return { slug: d.tool_id, savedAt: d.created_at };
          });
        }
      } catch (e) {
        console.warn('[SavedTools] Supabase getAll failed, using localStorage:', e);
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
    // Fast local check first (no network needed)
    if (this._getLocal().indexOf(slug) >= 0) return true;

    // If logged in, also check Supabase (in case migrated on another device)
    if (this._user && this._supabase) {
      try {
        var res = await this._supabase
          .from('favorites')
          .select('tool_id')
          .eq('user_id', this._user.id)
          .eq('tool_id', slug)
          .maybeSingle();

        if (!res.error && res.data) {
          // Also add to local cache
          this._addLocal(slug);
          return true;
        }
      } catch (e) { /* fall through */ }
    }

    return false;
  };

  // ── TOGGLE (convenience) ──────────────────────────────
  SavedTools.prototype.toggle = async function (slug, name, url, icon) {
    var saved = await this.isSaved(slug);
    if (saved) {
      await this.remove(slug);
      return false;
    } else {
      await this.save(slug, name, url, icon);
      return true;
    }
  };

  // ── CLEAR ALL ─────────────────────────────────────────
  SavedTools.prototype.clearAll = async function () {
    await this._ensureReady();

    if (this._user && this._supabase) {
      try {
        await this._supabase
          .from('favorites')
          .delete()
          .eq('user_id', this._user.id);
      } catch (e) { /* silent */ }
    }

    localStorage.setItem(LOCAL_KEY, JSON.stringify([]));
  };

  // ── COUNT ─────────────────────────────────────────────
  SavedTools.prototype.count = function () {
    return this._getLocal().length;
  };

  // ── MIGRATE LOCAL TO CLOUD ────────────────────────────
  SavedTools.prototype._migrateLocalToCloud = async function () {
    if (!this._user || !this._supabase) return;

    var local = this._getLocal();
    if (local.length === 0) return;

    try {
      // Batch upsert all local favorites to Supabase
      var rows = local.map(function (slug) {
        return { user_id: this._user.id, tool_id: slug };
      }.bind(this));

      await this._supabase
        .from('favorites')
        .upsert(rows, { onConflict: 'user_id,tool_id' });

      console.log('[SavedTools] Migrated ' + local.length + ' favorites to Supabase');
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
  // Keep the old afroFavs API working but backed by SavedTools
  var _instance = new SavedTools();

  window.afroFavs = {
    getAll: function () { return _instance._getLocal(); },
    has: function (id) { return _instance._getLocal().indexOf(id) >= 0; },
    toggle: function (id) {
      var favs = _instance._getLocal();
      if (favs.indexOf(id) >= 0) {
        _instance.remove(id); // async, but fire-and-forget for compat
        return false;
      } else {
        _instance.save(id, '', '', ''); // async, fire-and-forget
        return true;
      }
    },
    count: function () { return _instance._getLocal().length; }
  };

  // Export class for direct use
  window.SavedTools = SavedTools;
  window._savedToolsInstance = _instance;

})();
