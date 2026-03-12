// AfroTools Favorites — saves tool IDs to localStorage
// Usage: afroFavs.toggle(id), afroFavs.has(id), afroFavs.getAll()
(function() {
  const KEY = 'afro_favs_v1';

  window.afroFavs = {
    getAll() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    },
    has(id) { return this.getAll().includes(id); },
    toggle(id) {
      let favs = this.getAll();
      if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
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
