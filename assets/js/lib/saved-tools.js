(function () {
  'use strict';

  var STORAGE_KEY = 'afro_favs_v2';
  var MAX_FAVORITES = 50;
  var DEFAULT_TIMEOUT_MS = 8000;
  var favoritesInstance = null;

  function readLocalFavorites() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function writeLocalFavorites(favorites) {
    var deduped = [];
    (favorites || []).forEach(function (slug) {
      if (slug && deduped.indexOf(slug) === -1) {
        deduped.push(slug);
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped.slice(0, MAX_FAVORITES)));
    return deduped;
  }

  function createTimeoutPromise(ms) {
    return new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error('timeout'));
      }, ms || DEFAULT_TIMEOUT_MS);
    });
  }

  function isLoggedIn() {
    if (!window.AfroAuth) {
      return false;
    }

    try {
      if (typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn()) {
        return true;
      }
    } catch (error) {
      console.warn('[SavedTools] isLoggedIn check failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getUser === 'function') {
        var user = window.AfroAuth.getUser();
        if (user && user.id) return true;
      }
    } catch (error) {
      console.warn('[SavedTools] getUser fallback failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getCachedProfile === 'function') {
        var cachedProfile = window.AfroAuth.getCachedProfile();
        if (cachedProfile && cachedProfile.id) return true;
      }
    } catch (error) {
      console.warn('[SavedTools] getCachedProfile fallback failed:', error);
    }

    return false;
  }

  async function getSessionToken() {
    if (!window.AfroAuth) {
      return null;
    }

    if (typeof window.AfroAuth.getSessionTokenAsync === 'function') {
      try {
        var asyncToken = await window.AfroAuth.getSessionTokenAsync();
        if (asyncToken) return asyncToken;
      } catch (error) {
        console.warn('[SavedTools] async token lookup failed:', error);
      }
    }

    if (typeof window.AfroAuth.getSupabase === 'function') {
      try {
        var supabase = window.AfroAuth.getSupabase();
        if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
          var sessionResult = await supabase.auth.getSession();
          if (sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.access_token) {
            return sessionResult.data.session.access_token;
          }
        }
      } catch (error) {
        console.warn('[SavedTools] Supabase session lookup failed:', error);
      }
    }

    if (typeof window.AfroAuth.getSessionToken === 'function') {
      try {
        var token = window.AfroAuth.getSessionToken();
        if (token) return token;
      } catch (error) {
        console.warn('[SavedTools] sync token lookup failed:', error);
      }
    }

    try {
      var fallbackSession = JSON.parse(localStorage.getItem('sb-zpclagtgczsygrgztlts-auth-token') || 'null');
      if (fallbackSession && fallbackSession.access_token) {
        return fallbackSession.access_token;
      }
    } catch (error) {
      console.warn('[SavedTools] fallback token lookup failed:', error);
    }

    return null;
  }

  async function requestFavorites(path, options) {
    var token = await getSessionToken();
    if (!token) return null;

    var requestOptions = options || {};
    requestOptions.headers = Object.assign(
      {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      requestOptions.headers || {}
    );

    try {
      var response = await Promise.race([
        fetch(path, requestOptions),
        createTimeoutPromise(DEFAULT_TIMEOUT_MS)
      ]);
      return await response.json();
    } catch (error) {
      console.warn('[SavedTools] API error:', error);
      return null;
    }
  }

  function normalizeFavoriteItems(items) {
    return (items || []).map(function (item) {
      if (typeof item === 'string') {
        return { slug: item, savedAt: null };
      }
      if (!item) {
        return null;
      }
      return {
        slug: item.slug || item.tool_id || null,
        savedAt: item.savedAt || item.created_at || null
      };
    }).filter(function (item) {
      return item && item.slug;
    });
  }

  function uniqueSlugs(items) {
    var slugs = [];
    normalizeFavoriteItems(items).forEach(function (item) {
      if (slugs.indexOf(item.slug) === -1) {
        slugs.push(item.slug);
      }
    });
    return slugs;
  }

  function favoriteItemsEqual(a, b) {
    var left = normalizeFavoriteItems(a);
    var right = normalizeFavoriteItems(b);

    if (left.length !== right.length) return false;

    for (var index = 0; index < left.length; index += 1) {
      if (left[index].slug !== right[index].slug) return false;
      if ((left[index].savedAt || null) !== (right[index].savedAt || null)) return false;
    }

    return true;
  }

  function SavedTools() {
    this._ready = false;
    this._readyPromise = null;
    this._syncPromise = null;
    this._itemsCache = normalizeFavoriteItems(readLocalFavorites());
    this._boundAuthListener = this._handleAuthChange.bind(this);
    this._boundStorageListener = this._handleStorage.bind(this);
    this._readyPromise = this._init();
  }

  SavedTools.prototype._init = function () {
    var self = this;

    return new Promise(function (resolve) {
      function finishReady() {
        if (self._ready) return;
        self._ready = true;
        self._attachListeners();
        self.sync({ force: true }).finally(resolve);
      }

      function bootWithAfroAuth() {
        window.AfroAuth.onReady(function () {
          finishReady();
        });
      }

      if (window.AfroAuth && typeof window.AfroAuth.onReady === 'function') {
        bootWithAfroAuth();
        return;
      }

      var attempts = 0;
      var poller = setInterval(function () {
        attempts += 1;
        if (window.AfroAuth && typeof window.AfroAuth.onReady === 'function') {
          clearInterval(poller);
          bootWithAfroAuth();
          return;
        }
        if (attempts >= 40) {
          clearInterval(poller);
          finishReady();
        }
      }, 200);

      setTimeout(function () {
        clearInterval(poller);
        finishReady();
      }, 10000);
    });
  };

  SavedTools.prototype._attachListeners = function () {
    if (window._savedToolsListenersAttached) return;
    window._savedToolsListenersAttached = true;
    window.addEventListener('afro-auth-change', this._boundAuthListener);
    window.addEventListener('storage', this._boundStorageListener);
  };

  SavedTools.prototype._handleAuthChange = function () {
    this.sync({ force: true });
  };

  SavedTools.prototype._handleStorage = function (event) {
    if (event.key !== STORAGE_KEY) return;
    this._itemsCache = normalizeFavoriteItems(readLocalFavorites());
    this._emitChange('storage');
  };

  SavedTools.prototype._emitChange = function (source) {
    var favorites = this.getCachedSlugs();
    window.dispatchEvent(new CustomEvent('afro-favorites-change', {
      detail: {
        favorites: favorites.slice(),
        count: favorites.length,
        source: source || 'local'
      }
    }));
  };

  SavedTools.prototype._setLocalCache = function (items, source) {
    var nextItems = normalizeFavoriteItems(items);
    var changed = !favoriteItemsEqual(this._itemsCache, nextItems);
    this._itemsCache = nextItems;
    writeLocalFavorites(this.getCachedSlugs());
    if (changed) {
      this._emitChange(source || 'local');
    }
  };

  SavedTools.prototype.getCachedItems = function () {
    return normalizeFavoriteItems(this._itemsCache);
  };

  SavedTools.prototype.getCachedSlugs = function () {
    return uniqueSlugs(this._itemsCache);
  };

  SavedTools.prototype._fetchRemoteItems = async function () {
    var response = await requestFavorites('/api/favorites');
    if (!response || !Array.isArray(response.data)) {
      return null;
    }
    return normalizeFavoriteItems(response.data.map(function (item) {
      return {
        slug: item.tool_id,
        savedAt: item.created_at || null
      };
    }));
  };

  SavedTools.prototype.sync = async function (options) {
    var self = this;
    var settings = options || {};

    await this._readyPromise;

    if (!isLoggedIn()) {
      this._itemsCache = normalizeFavoriteItems(readLocalFavorites());
      this._emitChange('local');
      return this.getCachedItems();
    }

    if (this._syncPromise && !settings.force) {
      return this._syncPromise;
    }

    this._syncPromise = (async function () {
      var localSlugs = readLocalFavorites();
      var remoteItems = await self._fetchRemoteItems();

      if (!remoteItems) {
        self._itemsCache = normalizeFavoriteItems(localSlugs);
        self._emitChange('local');
        return self.getCachedItems();
      }

      var remoteSlugs = uniqueSlugs(remoteItems);
      var localOnly = localSlugs.filter(function (slug) {
        return remoteSlugs.indexOf(slug) === -1;
      });

      if (localOnly.length > 0) {
        for (var index = 0; index < localOnly.length; index += 1) {
          await requestFavorites('/api/favorites', {
            method: 'POST',
            body: JSON.stringify({ tool_id: localOnly[index] })
          });
        }

        var refreshedRemote = await self._fetchRemoteItems();
        if (refreshedRemote) {
          remoteItems = refreshedRemote;
        } else {
          remoteItems = remoteItems.concat(localOnly.map(function (slug) {
            return { slug: slug, savedAt: null };
          }));
        }
      }

      self._setLocalCache(remoteItems, 'cloud');
      return self.getCachedItems();
    })();

    try {
      return await this._syncPromise;
    } finally {
      this._syncPromise = null;
    }
  };

  SavedTools.prototype.save = async function (slug) {
    await this._readyPromise;
    if (!slug) return;

    var favorites = this.getCachedSlugs();
    if (favorites.indexOf(slug) === -1) {
      favorites.unshift(slug);
      favorites = favorites.slice(0, MAX_FAVORITES);
      this._setLocalCache(favorites, 'optimistic');
    }

    if (isLoggedIn()) {
      var response = await requestFavorites('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ tool_id: slug })
      });

      if (response && response.saved) {
        await this.sync({ force: true });
      }
    }
  };

  SavedTools.prototype.remove = async function (slug) {
    await this._readyPromise;
    if (!slug) return;

    var favorites = this.getCachedSlugs().filter(function (item) {
      return item !== slug;
    });
    this._setLocalCache(favorites, 'optimistic');

    if (isLoggedIn()) {
      await requestFavorites('/api/favorites?tool_id=' + encodeURIComponent(slug), {
        method: 'DELETE'
      });
      await this.sync({ force: true });
    }
  };

  SavedTools.prototype.getAll = async function () {
    await this.sync();
    return this.getCachedItems();
  };

  SavedTools.prototype.getAllSlugs = async function () {
    var items = await this.getAll();
    return uniqueSlugs(items);
  };

  SavedTools.prototype.isSaved = async function (slug) {
    await this.sync();
    return this.getCachedSlugs().indexOf(slug) !== -1;
  };

  SavedTools.prototype.toggle = async function (slug) {
    if (this.getCachedSlugs().indexOf(slug) !== -1) {
      await this.remove(slug);
      return false;
    }

    await this.save(slug);
    return true;
  };

  SavedTools.prototype.clearAll = async function () {
    await this._readyPromise;

    var favorites = this.getCachedSlugs();
    this._setLocalCache([], 'optimistic');

    if (isLoggedIn()) {
      for (var index = 0; index < favorites.length; index += 1) {
        await requestFavorites('/api/favorites?tool_id=' + encodeURIComponent(favorites[index]), {
          method: 'DELETE'
        });
      }
      await this.sync({ force: true });
    }
  };

  SavedTools.prototype.count = function () {
    return this.getCachedSlugs().length;
  };

  favoritesInstance = new SavedTools();

  window.afroFavs = {
    getAll: function () {
      return favoritesInstance.getCachedSlugs();
    },
    getAllAsync: function () {
      return favoritesInstance.getAllSlugs();
    },
    has: function (slug) {
      return favoritesInstance.getCachedSlugs().indexOf(slug) !== -1;
    },
    hasAsync: function (slug) {
      return favoritesInstance.isSaved(slug);
    },
    toggle: function (slug) {
      if (favoritesInstance.getCachedSlugs().indexOf(slug) !== -1) {
        favoritesInstance.remove(slug);
        return false;
      }

      favoritesInstance.save(slug);
      return true;
    },
    toggleAsync: function (slug) {
      return favoritesInstance.toggle(slug);
    },
    count: function () {
      return favoritesInstance.count();
    },
    sync: function () {
      return favoritesInstance.sync({ force: true });
    }
  };

  window.SavedTools = SavedTools;
  window._savedToolsInstance = favoritesInstance;
})();
