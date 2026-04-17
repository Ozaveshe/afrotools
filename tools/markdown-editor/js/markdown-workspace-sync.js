(function (window, document) {
  'use strict';

  var ITEM_TYPE = 'markdown-draft';
  var TOOL_SLUG = 'markdown-editor';
  var JSON_KEY = 'afro_markdown_draft';
  var TEXT_KEY = 'md-editor-content';
  var SYNC_INTERVAL_MS = 5000;
  var SAVE_DEBOUNCE_MS = 600;

  var saveTimer = null;
  var syncTimer = null;
  var lastFingerprint = '';
  var bootstrapCompleted = false;
  var syncInFlight = false;

  function getWorkspace() {
    return window.AfroWorkspace || null;
  }

  function getMarkdownApi() {
    return window.AfroMarkdownEditor || null;
  }

  function readLocalDraft() {
    var workspace = getWorkspace();
    if (!workspace) return null;

    var jsonDraft = workspace.readJson(JSON_KEY, null);
    if (jsonDraft && typeof jsonDraft.content === 'string') return jsonDraft;

    var legacyText = workspace.readText(TEXT_KEY, '');
    if (!legacyText) return null;

    return {
      content: legacyText,
      updatedAt: null,
    };
  }

  function writeLocalDraft(draft) {
    var workspace = getWorkspace();
    if (!workspace || !draft) return;
    workspace.writeJson(JSON_KEY, draft);
    workspace.writeText(TEXT_KEY, draft.content || '');
  }

  function draftTimestamp(draft) {
    if (!draft) return 0;
    return getWorkspace().getTimestamp(draft.updatedAt || draft.savedAt);
  }

  function buildDraftPayload() {
    var markdownApi = getMarkdownApi();
    if (!markdownApi || typeof markdownApi.getContent !== 'function') return null;

    return {
      content: markdownApi.getContent(),
      updatedAt: new Date().toISOString(),
    };
  }

  function buildDraftRecord(payload) {
    var draft = payload || buildDraftPayload();
    if (!draft) return null;

    var firstHeadingMatch = String(draft.content || '').match(/^#\s+(.+)$/m);
    var title = firstHeadingMatch ? firstHeadingMatch[1].trim() : 'Markdown Draft';

    return {
      itemType: ITEM_TYPE,
      itemKey: 'current',
      toolSlug: TOOL_SLUG,
      title: title,
      summary: getWorkspace().summarizeText(draft.content || '', 120),
      href: '/tools/markdown-editor/',
      payload: draft,
      meta: {
        length: (draft.content || '').length,
      },
    };
  }

  function applyDraft(draft) {
    var markdownApi = getMarkdownApi();
    if (!markdownApi || !draft) return;

    if (typeof markdownApi.setContent === 'function') {
      markdownApi.setContent(draft.content || '');
    }

    if (typeof markdownApi.updatePreview === 'function') {
      markdownApi.updatePreview();
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
      console.warn('[MarkdownWorkspaceSync] Sync failed:', error.message || error);
    } finally {
      syncInFlight = false;
    }
  }

  async function bootstrap() {
    if (bootstrapCompleted) return;
    if (!getWorkspace() || !getWorkspace().isSignedIn()) return;
    if (!getMarkdownApi()) return;

    var localDraft = readLocalDraft();
    var remoteItem = null;

    try {
      remoteItem = await getWorkspace().get(ITEM_TYPE, 'current');
    } catch (error) {
      console.warn('[MarkdownWorkspaceSync] Remote bootstrap failed:', error.message || error);
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
        console.warn('[MarkdownWorkspaceSync] Failed to upload local draft:', error.message || error);
      }
    } else {
      var currentPayload = buildDraftPayload();
      if (currentPayload) {
        writeLocalDraft(currentPayload);
        try {
          await getWorkspace().upsert(buildDraftRecord(currentPayload));
          lastFingerprint = JSON.stringify(currentPayload);
        } catch (error) {
          console.warn('[MarkdownWorkspaceSync] Failed to seed remote draft:', error.message || error);
        }
      }
    }

    bootstrapCompleted = true;
  }

  function attachListeners() {
    if (document.body.dataset.markdownWorkspaceBound === '1') return;
    document.body.dataset.markdownWorkspaceBound = '1';

    var editor = document.getElementById('editor');
    if (editor) {
      editor.addEventListener('input', scheduleSave);
    }

    window.addEventListener('beforeunload', function () {
      var payload = buildDraftPayload();
      if (payload) writeLocalDraft(payload);
    });
  }

  function start() {
    if (!getWorkspace() || !getMarkdownApi()) return;

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
