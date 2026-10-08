// Readable owner for every SaveState runtime. Build with scripts/build-save-state.js.
function createSaveStateApi(root) {
  'use strict';
  var messages = {
    READ_FAILED: ['Saved items cannot be read in this browser. Existing data has been kept.', 'Impossible de lire les éléments enregistrés. Les données existantes sont conservées.', 'Vipengee vilivyohifadhiwa haviwezi kusomwa. Data iliyopo imeachwa bila kubadilishwa.'],
    INVALID_STORAGE: ['Saved data is unreadable. It has been kept unchanged; export your current work before leaving.', 'Les données enregistrées sont illisibles. Elles sont conservées ; exportez votre travail avant de quitter.', 'Data iliyohifadhiwa haisomeki. Imeachwa bila kubadilishwa; hamisha kazi yako kabla ya kuondoka.'],
    WRITE_FAILED: ['This change was not saved. Existing saved items are unchanged. Export your work before leaving.', 'Cette modification n’a pas été enregistrée. Les éléments précédents sont conservés. Exportez votre travail avant de quitter.', 'Mabadiliko haya hayajahifadhiwa. Vipengee vya awali havijabadilishwa. Hamisha kazi yako kabla ya kuondoka.'],
    LIMIT_REACHED: ['Saved-item limit reached. Export a backup and delete an item before saving a new one.', 'Limite d’éléments enregistrés atteinte. Exportez une sauvegarde et supprimez un élément avant d’en ajouter un autre.', 'Umefikia kikomo cha vipengee vilivyohifadhiwa. Hamisha nakala na ufute kipengee kimoja kabla ya kuhifadhi kipya.'],
    INVALID_RECORD: ['This item could not be saved. Existing saved items are unchanged.', 'Cet élément n’a pas pu être enregistré. Les éléments précédents sont conservés.', 'Kipengee hiki hakikuweza kuhifadhiwa. Vipengee vya awali havijabadilishwa.'],
    AUTOSAVE_FAILED: ['Automatic saving failed. Export your work before leaving.', 'L’enregistrement automatique a échoué. Exportez votre travail avant de quitter.', 'Kuhifadhi kiotomatiki kumeshindikana. Hamisha kazi yako kabla ya kuondoka.']
  };
  function error(code) {
    var failure = new Error(messages[code][0]);
    failure.name = 'SaveStateError'; failure.code = code;
    return failure;
  }
  function message(failure, locale) {
    var language = String(locale || (root.document && root.document.documentElement.lang) || 'en').split('-')[0];
    var options = messages[failure && failure.code] || messages.WRITE_FAILED;
    return options[language === 'fr' ? 1 : language === 'sw' ? 2 : 0];
  }
  function validateRecords(records) {
    if (!Array.isArray(records)) throw error('INVALID_STORAGE');
    var seen = new Set();
    records.forEach(function(record) {
      if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string' || !record.id || seen.has(record.id) || typeof record.title !== 'string' || !Number.isFinite(record.createdAt) || !Number.isFinite(record.updatedAt) || !Object.prototype.hasOwnProperty.call(record, 'data')) throw error('INVALID_STORAGE');
      seen.add(record.id);
    });
    return records;
  }
  var sequence = 0;
  class SaveState {
    constructor(slug, options) {
      options = options || {};
      this.slug = slug; this.key = 'afrotools-saved-' + slug;
      this.maxFree = Number.isFinite(options.maxFree) && options.maxFree > 0 ? Math.floor(options.maxFree) : 20;
      this._autoTimer = null; this._currentId = null; this.lastError = null;
      this.onError = typeof options.onError === 'function' ? options.onError : null;
    }
    _operation(callback) {
      try { var result = callback(); this.lastError = null; return result; }
      catch (failure) { this.lastError = failure && failure.name === 'SaveStateError' ? failure : error('INVALID_RECORD'); throw this.lastError; }
    }
    _read() {
      var raw;
      try { raw = root.localStorage.getItem(this.key); }
      catch (_) { throw error('READ_FAILED'); }
      if (raw === null) return [];
      var records;
      try { records = JSON.parse(raw); }
      catch (_) { throw error('INVALID_STORAGE'); }
      return validateRecords(records);
    }
    _write(records) {
      var serialized;
      try { serialized = JSON.stringify(records); validateRecords(JSON.parse(serialized)); }
      catch (_) { throw error('INVALID_RECORD'); }
      // No quota retry, eviction, clearing, or success fallback. Storage writes are atomic.
      try { root.localStorage.setItem(this.key, serialized); }
      catch (_) { throw error('WRITE_FAILED'); }
    }
    save(input) {
      return this._operation(() => {
        if (!input || typeof input !== 'object' || input.data === undefined || (input.id != null && (typeof input.id !== 'string' || !input.id))) throw error('INVALID_RECORD');
        var records = this._read(), now = Date.now();
        var id = input.id || now.toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '-' + (++sequence).toString(36);
        var index = records.findIndex(function(record) { return record.id === id; });
        if (index < 0 && records.length >= this.maxFree) throw error('LIMIT_REACHED');
        var record = { id: id, title: String(input.title || 'Untitled'), data: input.data, thumbnail: input.thumbnail || null, createdAt: index >= 0 ? records[index].createdAt : now, updatedAt: now };
        if (index >= 0) records[index] = record; else records.unshift(record);
        this._write(records);
        return record;
      });
    }
    getAll() { return this._operation(() => this._read().sort(function(a, b) { return b.updatedAt - a.updatedAt; })); }
    load(id) { return this._operation(() => this._read().find(function(record) { return record.id === id; }) || null); }
    delete(id) {
      return this._operation(() => {
        var records = this._read(), remaining = records.filter(function(record) { return record.id !== id; });
        if (records.length === remaining.length) return false;
        this._write(remaining); return true;
      });
    }
    clear() { return this._operation(() => { this._read(); this._write([]); }); }
    enableAutoSave(callback, interval) {
      this.stopAutoSave();
      this._autoTimer = root.setInterval(() => {
        try {
          var input = callback(); if (!input) return;
          if (this._currentId) input = Object.assign({}, input, { id: this._currentId });
          this._currentId = this.save(input).id;
        } catch (failure) {
          var safeFailure = failure && failure.name === 'SaveStateError' ? failure : error('AUTOSAVE_FAILED');
          this.lastError = safeFailure;
          // Never print callback errors or user-entered content to the console.
          if (this.onError) { try { this.onError(safeFailure); } catch (_) { /* Error reporting must not leak callback content. */ } }
          else if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('afro-save-error', { detail: { toolId: this.slug, code: safeFailure.code } }));
        }
      }, interval || 30000);
      return { stop: () => this.stopAutoSave(), setCurrentId: id => { this._currentId = id; } };
    }
    stopAutoSave() { if (this._autoTimer !== null) { root.clearInterval(this._autoTimer); this._autoTimer = null; } }
    static message(failure, locale) { return message(failure, locale); }
  }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ago(timestamp) {
    var seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    var days = Math.floor(seconds / 86400);
    return days < 30 ? days + 'd ago' : new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function renderSavedItems(slug, targetId, options) {
    options = options || {};
    var target = root.document.getElementById(targetId); if (!target) return;
    var store = new SaveState(slug), parent = target.closest('.landing-saved') || target.parentElement;
    function showFailure(failure) {
      if (parent) parent.style.display = '';
      var status = target.querySelector('[data-save-state-status]');
      if (!status) { status = root.document.createElement('p'); status.setAttribute('data-save-state-status', ''); status.setAttribute('role', 'status'); target.appendChild(status); }
      status.textContent = message(failure);
    }
    var items;
    try { items = store.getAll(); }
    catch (failure) { showFailure(failure); return; }
    if (!items.length) {
      target.replaceChildren();
      if (parent && parent.classList.contains('landing-saved')) parent.style.display = 'none';
      else target.innerHTML = '<div class="saved-empty">' + escapeHtml(options.emptyMessage || 'No saved ' + (options.itemNoun || 'item') + 's yet. Create one to get started!') + '</div>';
      return;
    }
    if (parent) parent.style.display = '';
    var appUrl = options.appUrl || 'app.html';
    target.innerHTML = items.map(function(item) {
      var thumb = options.renderThumb ? options.renderThumb(item) : item.thumbnail ? '<div class="saved-card-thumb"><img src="' + escapeHtml(item.thumbnail) + '" alt="' + escapeHtml(item.title) + '"></div>' : '<div class="saved-card-thumb"><span style="font-size:.8rem;color:#9ca3af;">' + escapeHtml(item.title.slice(0, 2).toUpperCase()) + '</span></div>';
      return '<div class="saved-card" data-id="' + escapeHtml(item.id) + '">' + thumb + '<div class="saved-card-title">' + escapeHtml(item.title) + '</div><div class="saved-card-date">' + ago(item.updatedAt) + '</div><div class="saved-card-actions"><a class="saved-card-open" href="' + escapeHtml(appUrl) + '?id=' + encodeURIComponent(item.id) + '">Open</a><button class="saved-card-delete" data-delete="' + escapeHtml(item.id) + '">Delete</button></div></div>';
    }).join('');
    target.querySelectorAll('[data-delete]').forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault(); event.stopPropagation();
        try {
          var id = button.getAttribute('data-delete'), item = store.load(id);
          if (options.onDelete && options.onDelete(item) === false) return;
          if (!root.confirm('Delete "' + (item ? item.title : 'this item') + '"?')) return;
          store.delete(id); renderSavedItems(slug, targetId, options);
          var next = target.querySelector('button, a');
          if (next) next.focus();
          else {
            if (parent) parent.style.display = '';
            target.textContent = options.emptyMessage || 'No saved ' + (options.itemNoun || 'item') + 's yet. Create one to get started!';
            target.setAttribute('tabindex', '-1'); target.setAttribute('role', 'status'); target.focus();
          }
        } catch (failure) { showFailure(failure); }
      });
    });
    if (options.onOpen) target.querySelectorAll('.saved-card-open').forEach(function(link) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        try { var card = link.closest('.saved-card'), item = card ? store.load(card.getAttribute('data-id')) : null; if (item) options.onOpen(item); }
        catch (failure) { showFailure(failure); }
      });
    });
  }
  return { SaveState: SaveState, renderSavedItems: renderSavedItems };
}
