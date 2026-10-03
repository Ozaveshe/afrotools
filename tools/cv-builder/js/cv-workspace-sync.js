(function (window) {
  'use strict';
  var consentAccount = '', generation = 0, initialized = false, busy = false;
  var draftFingerprint = '', savedFingerprints = Object.create(null), cloudDraft = null;
  var selectedKey = new URLSearchParams(window.location.search).get('cv'), selectedCV = null;
  var checkbox, status, restoreButton;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function jsonData(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
    if (Array.isArray(value)) return value.map(jsonData);
    if (value && typeof value === 'object') {
      var result = {};
      Object.keys(value).forEach(function (key) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('Invalid cloud CV structure');
        result[key] = jsonData(value[key]);
      });
      return result;
    }
    throw new Error('Invalid cloud CV structure');
  }
  // Restore onto an empty model, never onto the current person's details.
  function model(value, defaults) {
    if (defaults === null) {
      if (value === null || typeof value === 'string') return value;
    } else if (Array.isArray(defaults)) {
      if (Array.isArray(value)) return value.map(function (row) { return model(row, defaults[0] || { title: '', content: '' }); });
    } else if (typeof defaults === 'object') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        var result = {};
        Object.keys(defaults).forEach(function (key) {
          result[key] = Object.prototype.hasOwnProperty.call(value, key) ? model(value[key], defaults[key]) : clone(defaults[key]);
        });
        Object.keys(value).forEach(function (key) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('Invalid cloud CV structure');
          if (!Object.prototype.hasOwnProperty.call(defaults, key)) result[key] = jsonData(value[key]);
        });
        return result;
      }
    } else if (typeof value === typeof defaults) return value;
    throw new Error('Invalid cloud CV structure');
  }
  function normalized(payload) {
    if (!payload || !payload.data || typeof createEmptyCV !== 'function') throw new Error('Invalid cloud CV structure');
    var result = jsonData(payload); result.data = model(payload.data, createEmptyCV());
    ['id', 'title', 'country', 'template', 'accentColor', 'accentHex'].forEach(function (key) {
      if (typeof payload[key] === 'string') result[key] = payload[key]; else delete result[key];
    });
    ['createdAt', 'updatedAt', 'savedAt'].forEach(function (key) {
      if (typeof payload[key] === 'string' || (typeof payload[key] === 'number' && Number.isFinite(payload[key]))) result[key] = payload[key]; else delete result[key];
    });
    return result;
  }
  function state() { return window.CVApp && window.CVApp.getState(); }
  function account() {
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === 'function' && !window.AfroAuth.isLoggedIn()) return '';
      var user = window.AfroWorkspace && window.AfroWorkspace.getUser();
      return user && user.id ? String(user.id) : '';
    } catch (error) { return ''; }
  }
  function allowed(run) { return run === generation && Boolean(consentAccount) && account() === consentAccount; }
  function options(run) { return { canRequest: function () { return allowed(run); } }; }
  function show(message) { if (status) status.textContent = message; }
  function stop(message) {
    generation += 1; consentAccount = ''; initialized = false; cloudDraft = null; selectedCV = null; savedFingerprints = Object.create(null);
    if (checkbox) checkbox.checked = false;
    if (restoreButton) restoreButton.disabled = true;
    show(message);
  }
  function current() {
    var cv = state();
    if (!cv || !cv.data) return null;
    return { data: clone(cv.data), country: cv.country, template: cv.template, accentColor: cv.accentColor, accentHex: cv.accentHex };
  }
  function draftItem(payload) {
    return { itemType: 'cv-draft', itemKey: 'current', toolSlug: 'cv-builder',
      title: ((payload.data.fn || '') + ' ' + (payload.data.ln || '')).trim() || 'CV Draft',
      summary: window.AfroWorkspace.summarizeText(payload.data.title || payload.data.summary || 'Continue editing your CV', 120),
      href: '/tools/cv-builder/', payload: payload, meta: { country: payload.country || '', template: payload.template || '' } };
  }
  function savedItem(cv) {
    var payload = clone(cv), name = ((payload.data && payload.data.fn || '') + ' ' + (payload.data && payload.data.ln || '')).trim();
    return { itemType: 'cv', itemKey: payload.id, toolSlug: 'cv-builder', title: payload.title || name || 'Untitled CV',
      summary: window.AfroWorkspace.summarizeText((name ? name + ' | ' : '') + (payload.template || 'CV template'), 120),
      href: '/tools/cv-builder/?cv=' + encodeURIComponent(payload.id), payload: payload,
      meta: { country: payload.country || '', template: payload.template || '' } };
  }
  function writeDraft(payload) {
    var workspace = window.AfroWorkspace;
    if (!workspace.writeJson('afro_cv_data', payload) || !workspace.writeJson('cv_builder_data', payload)) throw new Error('Local CV storage unavailable');
  }
  async function sync(run) {
    if (!initialized || busy || !allowed(run)) return;
    busy = true;
    try {
      var payload = current(), fingerprint = JSON.stringify(payload);
      if (payload && fingerprint !== draftFingerprint) {
        payload.updatedAt = new Date().toISOString();
        await window.AfroWorkspace.upsert(draftItem(payload), options(run));
        if (!allowed(run)) return;
        draftFingerprint = fingerprint;
      }
      var cv = state(), saved = cv && Array.isArray(cv.savedCVs) ? cv.savedCVs.slice() : [], present = Object.create(null);
      for (var index = 0; index < saved.length; index += 1) {
        if (!allowed(run)) return;
        var item = saved[index];
        if (!item || !item.id) continue;
        present[item.id] = true;
        var savedFingerprint = JSON.stringify(item);
        if (savedFingerprints[item.id] !== savedFingerprint) {
          await window.AfroWorkspace.upsert(savedItem(item), options(run));
          if (!allowed(run)) return;
          savedFingerprints[item.id] = savedFingerprint;
        }
      }
      var keys = Object.keys(savedFingerprints);
      for (var n = 0; n < keys.length; n += 1) {
        if (!allowed(run)) return;
        if (!present[keys[n]]) {
          await window.AfroWorkspace.remove({ itemType: 'cv', itemKey: keys[n] }, options(run));
          if (!allowed(run)) return;
          delete savedFingerprints[keys[n]];
        }
      }
      if (allowed(run)) show('Cloud backup is on for this session.');
    } catch (error) {
      if (allowed(run)) {
        console.warn('[CVWorkspaceSync] Sync failed:', { code: 'cv_sync_failed', tool_id: 'cv-builder' });
        stop('Cloud backup failed. Your local CV is still available. Enable it again to retry.');
      }
    } finally { busy = false; }
  }
  async function start() {
    var run = ++generation;
    consentAccount = account(); initialized = false; draftFingerprint = ''; savedFingerprints = Object.create(null); cloudDraft = null; selectedCV = null;
    restoreButton.disabled = true;
    if (!consentAccount) return stop('Sign in to enable optional cloud backup.');
    show('Opening your cloud backup…');
    try {
      var remote = await window.AfroWorkspace.list({ itemTypes: ['cv-draft', 'cv'], limit: 80, canRequest: options(run).canRequest });
      if (!allowed(run)) return;
      if (selectedKey && !remote.some(function (item) { return item.item_type === 'cv' && item.item_key === selectedKey; })) {
        var selected = await window.AfroWorkspace.list({ itemType: 'cv', itemKey: selectedKey, limit: 1, canRequest: options(run).canRequest });
        if (!allowed(run)) return;
        remote = remote.concat(selected.filter(function (item) { return item.item_type === 'cv' && item.item_key === selectedKey; }));
      }
      var cv = state(), saved = cv && Array.isArray(cv.savedCVs) ? cv.savedCVs.slice() : [], ids = Object.create(null);
      saved.forEach(function (item) { if (item && item.id) ids[item.id] = true; });
      remote.forEach(function (item) {
        if (item.item_type === 'cv-draft' && item.payload && item.payload.data) cloudDraft = normalized(item.payload);
        if (item.item_type === 'cv' && item.item_key && item.payload) {
          var restored = normalized(item.payload); restored.id = item.item_key;
          if (item.item_key === selectedKey) selectedCV = restored;
          savedFingerprints[item.item_key] = JSON.stringify(ids[item.item_key] ? item.payload : restored);
          if (!ids[item.item_key]) {
            saved.push(restored); ids[item.item_key] = true;
          }
        }
      });
      // Local drafts and same-id saved CVs win; restoring a cloud draft requires a separate action.
      if (!window.AfroWorkspace.writeJson('afro_cv_list', saved)) throw new Error('Local CV storage unavailable');
      if (cv) cv.savedCVs = saved;
      if (remote.some(function (item) { return item.item_type === 'cv'; }) && typeof window.CVApp.renderAll === 'function') window.CVApp.renderAll();
      restoreButton.textContent = selectedKey ? 'Open selected cloud CV' : 'Restore cloud draft';
      restoreButton.disabled = selectedKey ? !selectedCV : !cloudDraft;
      initialized = true;
      await sync(run);
    } catch (error) {
      if (allowed(run)) {
        console.warn('[CVWorkspaceSync] Remote bootstrap failed:', { code: 'cv_bootstrap_failed', tool_id: 'cv-builder' });
        stop('Cloud backup failed. Your local CV is still available. Enable it again to retry.');
      }
    }
  }
  function restore() {
    var run = generation;
    var target = selectedKey ? selectedCV : cloudDraft;
    if (!allowed(run) || !target || !window.confirm('Replace the draft in this browser with the selected cloud CV or draft? Export a local backup first if you want to keep both.')) return;
    if (!allowed(run)) return;
    try {
      var payload = normalized(target), cv = state();
      if (!cv) return;
      writeDraft(payload); cv.data = clone(payload.data);
      ['country', 'template', 'accentColor', 'accentHex'].forEach(function (key) { if (payload[key]) cv[key] = payload[key]; });
      cv.currentCVId = selectedKey || null;
      if (typeof window.CVApp.renderAll === 'function') window.CVApp.renderAll();
      draftFingerprint = ''; show('Cloud draft restored in this browser.'); sync(run);
    } catch (error) {
      console.warn('[CVWorkspaceSync] Restore failed:', { code: 'cv_restore_failed', tool_id: 'cv-builder' });
      stop('Local storage is unavailable. Cloud backup is off.');
    }
  }
  function check() {
    if (!window.CVApp) { checkbox.disabled = true; return; }
    var signedIn = Boolean(account());
    checkbox.disabled = !signedIn;
    if (consentAccount && account() !== consentAccount) stop('Your account changed. Cloud backup is off.');
    if (!consentAccount) { if (!signedIn) show('Sign in to enable optional cloud backup.'); return; }
    sync(generation);
  }
  function init() {
    checkbox = document.getElementById('cv-cloud-consent'); status = document.getElementById('cv-cloud-status'); restoreButton = document.getElementById('cv-cloud-restore');
    if (!checkbox || !restoreButton || !window.AfroWorkspace) return;
    checkbox.checked = false;
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) start();
      else stop('Cloud backup is off. Existing cloud copies are kept. Local editing and exports still work.');
    });
    restoreButton.addEventListener('click', restore);
    check();
    // The inline CV bridge exposes window.CVApp on DOMContentLoaded, after deferred scripts run.
    if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', check, { once: true });
    // One observer per page. Focus never grants permission or silently replaces a local draft.
    window.setInterval(check, 5000); window.addEventListener('focus', check);
    window.addEventListener('afro-auth-change', check);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}(window));
