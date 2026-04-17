(function (window) {
  'use strict';

  var DRAFT_TYPE = 'cv-draft';
  var ITEM_TYPE = 'cv';
  var TOOL_SLUG = 'cv-builder';
  var DRAFT_LOCAL_KEY = 'afro_cv_data';
  var LEGACY_DRAFT_KEY = 'cv_builder_data';
  var LIST_LOCAL_KEY = 'afro_cv_list';
  var SYNC_INTERVAL_MS = 5000;

  var bootstrapCompleted = false;
  var syncInFlight = false;
  var lastDraftFingerprint = '';
  var lastListFingerprint = '';
  var remoteSavedIndex = {};
  var sessionStartedAt = Date.now();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getState() {
    if (!window.CVApp || typeof window.CVApp.getState !== 'function') return null;
    return window.CVApp.getState();
  }

  function getLocalDraft() {
    var workspace = window.AfroWorkspace;
    if (!workspace) return null;
    return workspace.readJson(DRAFT_LOCAL_KEY, workspace.readJson(LEGACY_DRAFT_KEY, null));
  }

  function writeLocalDraft(draft) {
    var workspace = window.AfroWorkspace;
    if (!workspace) return;
    workspace.writeJson(DRAFT_LOCAL_KEY, draft);
    workspace.writeJson(LEGACY_DRAFT_KEY, draft);
  }

  function getLocalSavedList() {
    var workspace = window.AfroWorkspace;
    if (!workspace) return [];
    var list = workspace.readJson(LIST_LOCAL_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function writeLocalSavedList(items) {
    var workspace = window.AfroWorkspace;
    if (!workspace) return;
    workspace.writeJson(LIST_LOCAL_KEY, items);
  }

  function draftTimestamp(draft) {
    if (!draft) return 0;
    return window.AfroWorkspace.getTimestamp(draft.updatedAt || draft.savedAt);
  }

  function listTimestamp(item) {
    if (!item) return 0;
    return window.AfroWorkspace.getTimestamp(item.updatedAt || item.createdAt);
  }

  function buildDraftPayload() {
    var state = getState();
    if (!state) return null;

    return {
      data: clone(state.data),
      country: state.country,
      template: state.template,
      accentColor: state.accentColor,
      accentHex: state.accentHex,
      updatedAt: new Date().toISOString(),
    };
  }

  function buildDraftRecord() {
    var payload = buildDraftPayload();
    if (!payload || !payload.data) return null;

    var fullName = ((payload.data.fn || '') + ' ' + (payload.data.ln || '')).trim();
    var title = fullName || 'CV Draft';
    var summary = payload.data.title || payload.data.summary || 'Continue editing your CV';

    return {
      itemType: DRAFT_TYPE,
      itemKey: 'current',
      toolSlug: TOOL_SLUG,
      title: title,
      summary: window.AfroWorkspace.summarizeText(summary, 120),
      href: '/tools/cv-builder/',
      payload: payload,
      meta: {
        country: payload.country || '',
        template: payload.template || '',
      },
    };
  }

  function buildSavedRecord(item) {
    var safeItem = clone(item);
    var fullName = '';
    if (safeItem.data) {
      fullName = ((safeItem.data.fn || '') + ' ' + (safeItem.data.ln || '')).trim();
    }

    return {
      itemType: ITEM_TYPE,
      itemKey: safeItem.id,
      toolSlug: TOOL_SLUG,
      title: safeItem.title || fullName || 'Untitled CV',
      summary: window.AfroWorkspace.summarizeText(
        (fullName ? fullName + ' | ' : '') + (safeItem.template || 'CV template'),
        120
      ),
      href: '/tools/cv-builder/?cv=' + encodeURIComponent(safeItem.id),
      payload: safeItem,
      meta: {
        country: safeItem.country || '',
        template: safeItem.template || '',
      },
    };
  }

  function applySavedItem(savedItem) {
    var state = getState();
    if (!state || !savedItem) return;

    state.data = Object.assign({}, state.data, clone(savedItem.data || {}));
    state.country = savedItem.country || state.country || 'NG';
    state.template = savedItem.template || state.template || 'slate';
    state.accentColor = savedItem.accentColor || state.accentColor || 'var(--color-primary)';
    state.accentHex = savedItem.accentHex || state.accentHex || '#007AFF';
    state.currentCVId = savedItem.id || null;
    writeLocalDraft({
      data: clone(state.data),
      country: state.country,
      template: state.template,
      accentColor: state.accentColor,
      accentHex: state.accentHex,
      updatedAt: savedItem.updatedAt || new Date().toISOString(),
    });

    if (typeof window.CVApp.renderAll === 'function') {
      window.CVApp.renderAll();
    }
  }

  function applyDraftItem(draftItem) {
    if (!draftItem || !draftItem.payload) return;
    var state = getState();
    if (!state) return;

    var payload = draftItem.payload;
    state.data = Object.assign({}, state.data, clone(payload.data || {}));
    state.country = payload.country || state.country || 'NG';
    state.template = payload.template || state.template || 'slate';
    state.accentColor = payload.accentColor || state.accentColor || 'var(--color-primary)';
    state.accentHex = payload.accentHex || state.accentHex || '#007AFF';
    writeLocalDraft(payload);

    if (typeof window.CVApp.renderAll === 'function') {
      window.CVApp.renderAll();
    }
  }

  function getSavedListFingerprint(items) {
    return JSON.stringify(
      (items || []).map(function (item) {
        return [item.id, item.updatedAt || item.createdAt || ''];
      })
    );
  }

  async function bootstrapSync() {
    if (bootstrapCompleted) return;
    if (!window.AfroWorkspace || !window.AfroWorkspace.isSignedIn()) return;
    if (!window.CVApp || typeof window.CVApp.getState !== 'function') return;

    var remoteItems = [];
    try {
      remoteItems = await window.AfroWorkspace.list({
        itemTypes: [DRAFT_TYPE, ITEM_TYPE],
        limit: 80,
      });
    } catch (error) {
      console.warn('[CVWorkspaceSync] Remote bootstrap failed:', error.message || error);
      return;
    }

    var remoteDraft = null;
    var remoteSaved = [];
    remoteSavedIndex = {};

    remoteItems.forEach(function (item) {
      if (item.item_type === DRAFT_TYPE) {
        remoteDraft = item;
        return;
      }

      if (item.item_type === ITEM_TYPE && item.payload && item.item_key) {
        remoteSaved.push(clone(item.payload));
        remoteSavedIndex[item.item_key] = {
          fingerprint: JSON.stringify(item.payload),
          updatedAt: item.updated_at || '',
        };
      }
    });

    var localDraft = getLocalDraft();
    var localSaved = getLocalSavedList();
    var state = getState();
    var urlParams = new URLSearchParams(window.location.search);
    var requestedCvId = urlParams.get('cv');
    var isNewDraft = urlParams.get('new') === '1';

    if (!remoteSaved.length && localSaved.length) {
      for (var index = 0; index < localSaved.length; index += 1) {
        try {
          await window.AfroWorkspace.upsert(buildSavedRecord(localSaved[index]));
          remoteSavedIndex[localSaved[index].id] = {
            fingerprint: JSON.stringify(localSaved[index]),
            updatedAt: localSaved[index].updatedAt || '',
          };
        } catch (error) {
          console.warn('[CVWorkspaceSync] Failed to upload local CV:', error.message || error);
        }
      }
      remoteSaved = localSaved.slice();
    } else if (remoteSaved.length) {
      writeLocalSavedList(remoteSaved);
      state.savedCVs = remoteSaved.slice();
    }

    if (requestedCvId) {
      var requestedItem = remoteSaved.find(function (item) { return item.id === requestedCvId; }) ||
        localSaved.find(function (item) { return item.id === requestedCvId; });
      if (requestedItem) {
        applySavedItem(requestedItem);
      }
    } else if (!isNewDraft) {
      var remoteDraftPayload = remoteDraft && remoteDraft.payload ? remoteDraft.payload : null;
      if (remoteDraftPayload && draftTimestamp(remoteDraftPayload) >= draftTimestamp(localDraft)) {
        applyDraftItem(remoteDraft);
      } else if (!remoteDraftPayload && localDraft) {
        try {
          await window.AfroWorkspace.upsert(buildDraftRecord());
        } catch (error) {
          console.warn('[CVWorkspaceSync] Failed to upload local draft:', error.message || error);
        }
      }
    }

    if (state && Array.isArray(state.savedCVs)) {
      lastListFingerprint = getSavedListFingerprint(state.savedCVs);
    }

    var draftRecord = buildDraftRecord();
    lastDraftFingerprint = draftRecord ? JSON.stringify(draftRecord.payload) : '';
    bootstrapCompleted = true;
  }

  async function syncLoop() {
    if (!bootstrapCompleted || syncInFlight) return;
    if (!window.AfroWorkspace || !window.AfroWorkspace.isSignedIn()) return;

    syncInFlight = true;
    try {
      var draftRecord = buildDraftRecord();
      if (draftRecord) {
        var draftFingerprint = JSON.stringify(draftRecord.payload);
        if (draftFingerprint !== lastDraftFingerprint) {
          await window.AfroWorkspace.upsert(draftRecord);
          writeLocalDraft(draftRecord.payload);
          lastDraftFingerprint = draftFingerprint;
        }
      }

      var state = getState();
      var currentSaved = state && Array.isArray(state.savedCVs) ? state.savedCVs.slice() : getLocalSavedList();
      var listFingerprint = getSavedListFingerprint(currentSaved);

      if (listFingerprint !== lastListFingerprint) {
        var currentMap = {};

        for (var index = 0; index < currentSaved.length; index += 1) {
          var item = currentSaved[index];
          currentMap[item.id] = item;

          var nextFingerprint = JSON.stringify(item);
          if (!remoteSavedIndex[item.id] || remoteSavedIndex[item.id].fingerprint !== nextFingerprint) {
            await window.AfroWorkspace.upsert(buildSavedRecord(item));
          }
        }

        var remoteIds = Object.keys(remoteSavedIndex);
        for (var remoteIndex = 0; remoteIndex < remoteIds.length; remoteIndex += 1) {
          var remoteId = remoteIds[remoteIndex];
          if (!currentMap[remoteId]) {
            await window.AfroWorkspace.remove({ itemType: ITEM_TYPE, itemKey: remoteId });
          }
        }

        remoteSavedIndex = {};
        currentSaved.forEach(function (item) {
          remoteSavedIndex[item.id] = {
            fingerprint: JSON.stringify(item),
            updatedAt: item.updatedAt || '',
          };
        });

        writeLocalSavedList(currentSaved);
        lastListFingerprint = listFingerprint;
      }
    } catch (error) {
      console.warn('[CVWorkspaceSync] Sync failed:', error.message || error);
    } finally {
      syncInFlight = false;
    }
  }

  function start() {
    if (!window.AfroWorkspace || !window.CVApp) return;

    bootstrapSync().then(function () {
      if (!bootstrapCompleted) return;
      window.setInterval(syncLoop, SYNC_INTERVAL_MS);
      window.addEventListener('focus', function () {
        bootstrapCompleted = false;
        bootstrapSync();
      });
      window.addEventListener('beforeunload', syncLoop);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
