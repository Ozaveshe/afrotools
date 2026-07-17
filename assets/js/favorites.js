// AfroTools Favorites — saves tool IDs to localStorage + Supabase sync
// Usage: afroFavs.toggle(id), afroFavs.has(id), afroFavs.getAll()
// Unified key: afro_favs_v2 (matches AfroData in afro-auth.js)
//
// This file provides the basic localStorage API. The full SavedTools library
// in /assets/js/lib/saved-tools.js overrides window.afroFavs with a version
// that syncs to Supabase for logged-in users. Load saved-tools.js AFTER this
// file for cross-device sync.

(function() {
  var KEY = 'afro_favs_v2';
  var OLD_KEY = 'afro_favs_v1';

  // Migrate v1 → v2 on first load
  (function migrate() {
    var old = localStorage.getItem(OLD_KEY);
    if (!old) return;
    try {
      var oldFavs = JSON.parse(old);
      var current = JSON.parse(localStorage.getItem(KEY) || '[]');
      var merged = current.slice();
      oldFavs.forEach(function(id) {
        if (merged.indexOf(id) === -1) merged.push(id);
      });
      localStorage.setItem(KEY, JSON.stringify(merged));
      localStorage.removeItem(OLD_KEY);
    } catch(e) {
      localStorage.removeItem(OLD_KEY);
    }
  })();

  // Base afroFavs — may be overridden by saved-tools.js
  if (!window.afroFavs) {
    window.afroFavs = {
      getAll: function() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch(e) { return []; }
      },
      has: function(id) { return this.getAll().indexOf(id) >= 0; },
      toggle: function(id) {
        var favs = this.getAll();
        if (favs.indexOf(id) >= 0) {
          favs = favs.filter(function(f) { return f !== id; });
        } else {
          favs.unshift(id);
          if (favs.length > 50) favs = favs.slice(0, 50);
        }
        localStorage.setItem(KEY, JSON.stringify(favs));
        return favs.indexOf(id) >= 0;
      },
      count: function() { return this.getAll().length; }
    };
  }
})();
