/**
 * AFROTOOLS — Save State Library
 * Persistent localStorage save/resume for flagship tools
 * Usage:
 *   import { SaveState, renderSavedItems } from '/assets/js/lib/save-state.js';
 *   const ss = new SaveState('afrodraft');
 *   ss.save({ id: 'abc', title: 'My Drawing', data: {...} });
 */

/* ── helpers ── */
function uid() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400);
  if (d < 30) return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── SaveState class ── */
class SaveState {
  /**
   * @param {string} toolSlug  e.g. 'afrodraft', 'boq-builder'
   * @param {object} opts
   * @param {number} opts.maxFree  max items for free tier (default 20)
   */
  constructor(toolSlug, opts = {}) {
    this.slug = toolSlug;
    this.key = 'afrotools-saved-' + toolSlug;
    this.maxFree = opts.maxFree || 20;
    this._autoTimer = null;
    this._currentId = null;
  }

  /* ── CRUD ── */

  /**
   * Save or update an item.
   * @param {object} item  { id?, title, data, thumbnail? }
   * @returns {object} the saved entry
   */
  save(item) {
    const all = this._read();
    const now = Date.now();
    const id = item.id || uid();

    const idx = all.findIndex(function (e) { return e.id === id; });
    const entry = {
      id: id,
      title: item.title || 'Untitled',
      data: item.data,
      thumbnail: item.thumbnail || null,
      createdAt: idx >= 0 ? all[idx].createdAt : now,
      updatedAt: now
    };

    if (idx >= 0) {
      all[idx] = entry;
    } else {
      all.unshift(entry);
      // Enforce free-tier limit
      if (all.length > this.maxFree) all.length = this.maxFree;
    }

    this._write(all);
    return entry;
  }

  /**
   * Get all saved items, newest first.
   * @returns {Array}
   */
  getAll() {
    return this._read().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  }

  /**
   * Load a single item by id.
   * @param {string} id
   * @returns {object|null}
   */
  load(id) {
    return this._read().find(function (e) { return e.id === id; }) || null;
  }

  /**
   * Delete a single item by id.
   * @param {string} id
   * @returns {boolean} true if found and removed
   */
  delete(id) {
    var all = this._read();
    var len = all.length;
    all = all.filter(function (e) { return e.id !== id; });
    if (all.length < len) {
      this._write(all);
      return true;
    }
    return false;
  }

  /**
   * Delete all items for this tool.
   */
  clear() {
    this._write([]);
  }

  /* ── Auto-save ── */

  /**
   * Enable periodic auto-saving.
   * @param {function} getStateFn  called each tick; should return { id?, title, data, thumbnail? } or null to skip
   * @param {number}   intervalMs  default 30 000 (30 s)
   * @returns {{ stop: function, setCurrentId: function }}
   */
  enableAutoSave(getStateFn, intervalMs) {
    var self = this;
    intervalMs = intervalMs || 30000;

    this.stopAutoSave();

    this._autoTimer = setInterval(function () {
      try {
        var state = getStateFn();
        if (!state) return;
        if (self._currentId) state.id = self._currentId;
        var saved = self.save(state);
        self._currentId = saved.id;
      } catch (e) {
        console.warn('[SaveState] auto-save error:', e);
      }
    }, intervalMs);

    return {
      stop: function () { self.stopAutoSave(); },
      setCurrentId: function (id) { self._currentId = id; }
    };
  }

  /**
   * Stop auto-saving.
   */
  stopAutoSave() {
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
      this._autoTimer = null;
    }
  }

  /* ── Internal ── */

  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch (e) {
      return [];
    }
  }

  _write(arr) {
    try {
      localStorage.setItem(this.key, JSON.stringify(arr));
    } catch (e) {
      console.warn('[SaveState] storage full, removing oldest item');
      arr.pop();
      try { localStorage.setItem(this.key, JSON.stringify(arr)); } catch (_) {}
    }
  }
}


/* ── renderSavedItems ── */

/**
 * Render saved-item cards into a container on the page.
 *
 * @param {string}  toolSlug     e.g. 'afrodraft'
 * @param {string}  containerId  id of a DOM element (the .saved-grid)
 * @param {object}  opts
 * @param {string}  opts.appUrl        URL of the app page (default 'app.html')
 * @param {string}  opts.emptyMessage  shown when no items exist
 * @param {string}  opts.itemNoun      e.g. 'drawing', 'invoice' (for empty text)
 * @param {function} opts.onOpen       called with (item) instead of navigating
 * @param {function} opts.onDelete     called with (item) after deletion; return false to cancel
 * @param {function} opts.renderThumb  custom thumbnail renderer; receives item, returns HTML string
 */
function renderSavedItems(toolSlug, containerId, opts) {
  opts = opts || {};
  var container = document.getElementById(containerId);
  if (!container) return;

  var ss = new SaveState(toolSlug);
  var items = ss.getAll();

  // Find the wrapping section (to hide when empty)
  var section = container.closest('.landing-saved') || container.parentElement;

  if (!items.length) {
    if (section && section.classList.contains('landing-saved')) {
      section.style.display = 'none';
    } else {
      container.innerHTML = '<div class="saved-empty">' +
        (opts.emptyMessage || 'No saved ' + (opts.itemNoun || 'item') + 's yet. Create one to get started!') +
        '</div>';
    }
    return;
  }

  if (section) section.style.display = '';

  var appUrl = opts.appUrl || 'app.html';
  var html = '';

  items.forEach(function (item) {
    var thumb = '';
    if (opts.renderThumb) {
      thumb = opts.renderThumb(item);
    } else if (item.thumbnail) {
      thumb = '<div class="saved-card-thumb"><img src="' + escHtml(item.thumbnail) + '" alt="' + escHtml(item.title) + '"></div>';
    } else {
      thumb = '<div class="saved-card-thumb"><span style="font-size:.8rem;color:#9ca3af;">' + escHtml(item.title.slice(0, 2).toUpperCase()) + '</span></div>';
    }

    html += '<div class="saved-card" data-id="' + escHtml(item.id) + '">' +
      thumb +
      '<div class="saved-card-title">' + escHtml(item.title) + '</div>' +
      '<div class="saved-card-date">' + ago(item.updatedAt) + '</div>' +
      '<div class="saved-card-actions">' +
        '<a class="saved-card-open" href="' + appUrl + '?id=' + encodeURIComponent(item.id) + '">Open</a>' +
        '<button class="saved-card-delete" data-delete="' + escHtml(item.id) + '">Delete</button>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;

  // Wire delete buttons
  container.querySelectorAll('[data-delete]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-delete');
      var item = ss.load(id);
      if (opts.onDelete && opts.onDelete(item) === false) return;
      if (!confirm('Delete "' + (item ? item.title : 'this item') + '"?')) return;
      ss.delete(id);
      renderSavedItems(toolSlug, containerId, opts); // re-render
    });
  });

  // Wire open buttons (custom handler)
  if (opts.onOpen) {
    container.querySelectorAll('.saved-card-open').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var card = a.closest('.saved-card');
        var id = card ? card.getAttribute('data-id') : null;
        var item = id ? ss.load(id) : null;
        if (item) opts.onOpen(item);
      });
    });
  }
}

/* ── Utility ── */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Exports ── */
// Note: the export statement means this file must be loaded as a module
// (type="module") or imported via ES module import. Loading as a regular
// <script> will cause a SyntaxError. Use window.SaveState / window.renderSavedItems
// for non-module contexts after loading as type="module".
if (typeof window !== 'undefined') {
  window.SaveState = SaveState;
  window.renderSavedItems = renderSavedItems;
}

export { SaveState, renderSavedItems };
