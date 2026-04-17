(function (window, document) {
  'use strict';

  var ITEM_TYPE = 'invoice-draft';
  var TOOL_SLUG = 'invoice-generator';
  var LOCAL_KEY = 'afro_invoice_draft';
  var SYNC_INTERVAL_MS = 5000;
  var SAVE_DEBOUNCE_MS = 800;

  var saveTimer = null;
  var syncTimer = null;
  var lastFingerprint = '';
  var bootstrapCompleted = false;
  var syncInFlight = false;

  function getWorkspace() {
    return window.AfroWorkspace || null;
  }

  function getInvoiceApi() {
    return window.AfroInvoiceState || null;
  }

  function getLocalDraft() {
    var workspace = getWorkspace();
    if (!workspace) return null;
    return workspace.readJson(LOCAL_KEY, null);
  }

  function writeLocalDraft(draft) {
    var workspace = getWorkspace();
    if (!workspace) return;
    workspace.writeJson(LOCAL_KEY, draft);
  }

  function draftTimestamp(draft) {
    if (!draft) return 0;
    return getWorkspace().getTimestamp(draft.updatedAt || draft.savedAt);
  }

  function buildDraftPayload() {
    var invoiceApi = getInvoiceApi();
    if (!invoiceApi || typeof invoiceApi.gatherState !== 'function') return null;

    return {
      state: invoiceApi.gatherState(),
      updatedAt: new Date().toISOString(),
    };
  }

  function buildDraftRecord(payload) {
    var draft = payload || buildDraftPayload();
    if (!draft || !draft.state) return null;

    var state = draft.state;
    var title = state.in || state.cn || 'Invoice Draft';
    var summaryParts = [];

    if (state.cl) summaryParts.push(state.cl);
    if (state.cu) summaryParts.push(state.cu);
    if (state.id) summaryParts.push(state.id);

    return {
      itemType: ITEM_TYPE,
      itemKey: 'current',
      toolSlug: TOOL_SLUG,
      title: title,
      summary: summaryParts.join(' | '),
      href: '/tools/invoice-generator/',
      payload: draft,
      meta: {
        currency: state.cu || '',
        invoiceNumber: state.in || '',
      },
    };
  }

  function applyDraft(draft) {
    var invoiceApi = getInvoiceApi();
    if (!invoiceApi || !draft || !draft.state) return;

    if (typeof invoiceApi.restoreState === 'function') {
      invoiceApi.restoreState(draft.state);
    }

    if (typeof invoiceApi.updatePreview === 'function') {
      invoiceApi.updatePreview();
    }

    writeLocalDraft(draft);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var payload = buildDraftPayload();
      if (!payload) return;

      writeLocalDraft(payload);
      scheduleRemoteSync();
    }, SAVE_DEBOUNCE_MS);
  }

  function scheduleRemoteSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 1200);
  }

  async function syncNow() {
    if (!bootstrapCompleted || syncInFlight) return;
    if (!getWorkspace() || !getWorkspace().isSignedIn()) return;

    var record = buildDraftRecord();
    if (!record) return;

    var fingerprint = JSON.stringify(record.payload);
    if (fingerprint === lastFingerprint) return;

    syncInFlight = true;
    try {
      await getWorkspace().upsert(record);
      lastFingerprint = fingerprint;
    } catch (error) {
      console.warn('[InvoiceWorkspaceSync] Sync failed:', error.message || error);
    } finally {
      syncInFlight = false;
    }
  }

  async function bootstrap() {
    if (bootstrapCompleted) return;
    if (!getWorkspace() || !getWorkspace().isSignedIn()) return;
    if (!getInvoiceApi()) return;

    var localDraft = getLocalDraft();
    var remoteItem = null;

    try {
      remoteItem = await getWorkspace().get(ITEM_TYPE, 'current');
    } catch (error) {
      console.warn('[InvoiceWorkspaceSync] Remote bootstrap failed:', error.message || error);
    }

    var remoteDraft = remoteItem && remoteItem.payload ? remoteItem.payload : null;

    if (remoteDraft && draftTimestamp(remoteDraft) >= draftTimestamp(localDraft)) {
      applyDraft(remoteDraft);
      lastFingerprint = JSON.stringify(remoteDraft);
    } else if (localDraft) {
      applyDraft(localDraft);
      try {
        await getWorkspace().upsert(buildDraftRecord(localDraft));
        lastFingerprint = JSON.stringify(localDraft);
      } catch (error) {
        console.warn('[InvoiceWorkspaceSync] Failed to upload local draft:', error.message || error);
      }
    } else {
      var currentPayload = buildDraftPayload();
      if (currentPayload) {
        writeLocalDraft(currentPayload);
        try {
          await getWorkspace().upsert(buildDraftRecord(currentPayload));
          lastFingerprint = JSON.stringify(currentPayload);
        } catch (error) {
          console.warn('[InvoiceWorkspaceSync] Failed to seed remote draft:', error.message || error);
        }
      }
    }

    bootstrapCompleted = true;
  }

  function attachListeners() {
    if (document.body.dataset.invoiceWorkspaceBound === '1') return;
    document.body.dataset.invoiceWorkspaceBound = '1';

    var formRoot = document.querySelector('.inv-page');
    if (formRoot) {
      formRoot.addEventListener('input', scheduleSave);
      formRoot.addEventListener('change', scheduleSave);
    }

    var newButton = document.getElementById('btnNewInvoice');
    if (newButton) {
      newButton.addEventListener('click', function () {
        setTimeout(scheduleSave, 0);
      });
    }

    window.addEventListener('beforeunload', function () {
      var payload = buildDraftPayload();
      if (payload) writeLocalDraft(payload);
    });
  }

  function start() {
    if (!getWorkspace() || !getInvoiceApi()) return;

    attachListeners();
    bootstrap().then(function () {
      if (!bootstrapCompleted) return;
      scheduleSave();
      window.setInterval(syncNow, SYNC_INTERVAL_MS);
      window.addEventListener('focus', function () {
        bootstrapCompleted = false;
        bootstrap();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window, document);
