// AfroTools Favorites — saves tool IDs to localStorage
// Usage: afroFavs.toggle(id), afroFavs.has(id), afroFavs.getAll()
// Unified key: afro_favs_v2 (matches AfroData in afro-auth.js)
(function() {
  const KEY = 'afro_favs_v2';
  const OLD_KEY = 'afro_favs_v1';

  // Migrate v1 → v2 on first load
  (function migrate() {
    const old = localStorage.getItem(OLD_KEY);
    if (!old) return;
    try {
      const oldFavs = JSON.parse(old);
      const current = JSON.parse(localStorage.getItem(KEY) || '[]');
      // Merge: add any v1 favs not already in v2
      const merged = [...current];
      oldFavs.forEach(function(id) {
        if (!merged.includes(id)) merged.push(id);
      });
      localStorage.setItem(KEY, JSON.stringify(merged));
      localStorage.removeItem(OLD_KEY);
    } catch(e) {
      localStorage.removeItem(OLD_KEY);
    }
  })();

  window.afroFavs = {
    getAll() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    },
    has(id) { return this.getAll().includes(id); },
    toggle(id) {
      var favs = this.getAll();
      if (favs.includes(id)) {
        favs = favs.filter(function(f) { return f !== id; });
      } else {
        favs.unshift(id);
        if (favs.length > 20) favs = favs.slice(0, 20);
      }
      localStorage.setItem(KEY, JSON.stringify(favs));
      return favs.includes(id);
    },
    count() { return this.getAll().length; }
  };
})();
