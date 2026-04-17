(function (window) {
  'use strict';

  var DRAFT_TYPE = 'floor-plan-draft';
  var ITEM_TYPE = 'floor-plan';
  var TOOL_SLUG = 'floor-planner';
  var DRAFT_LOCAL_KEY = 'afro_fp_autosave';
  var LIST_LOCAL_KEY = 'afro_fp_list';
  var ITEM_PREFIX = 'afro_fp_';
  var SYNC_INTERVAL_MS = 8000;

  var bootstrapCompleted = false;
  var syncInFlight = false;
  var lastDraftFingerprint = '';
  var lastPlansFingerprint = '';
  var remotePlanIndex = {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getWorkspace() {
    return window.AfroWorkspace || null;
  }

  function getLocalDraft() {
    var workspace = getWorkspace();
    if (!workspace) return null;
    return workspace.readJson(DRAFT_LOCAL_KEY, null);
  }

  function writeLocalDraft(value) {
    var workspace = getWorkspace();
    if (!workspace) return;
    workspace.writeJson(DRAFT_LOCAL_KEY, value);
  }

  function readLocalPlanList() {
    var workspace = getWorkspace();
    if (!workspace) return [];
    var list = workspace.readJson(LIST_LOCAL_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function writeLocalPlan(plan) {
    var workspace = getWorkspace();
    if (!workspace || !plan || !plan.id) return;

    workspace.writeJson(ITEM_PREFIX + plan.id, plan);

    var list = readLocalPlanList();
    var summary = {
      id: plan.id,
      name: plan.name || 'Untitled Plan',
      updatedAt: plan.updatedAt || plan.savedAt || Date.now(),
      rooms: typeof plan.rooms === 'number' ? plan.rooms : countRooms(plan),
      area: typeof plan.area === 'number' ? plan.area : countArea(plan),
    };
    var index = list.findIndex(function (item) { return item.id === summary.id; });

    if (index >= 0) {
      list[index] = summary;
    } else {
      list.unshift(summary);
    }

    workspace.writeJson(LIST_LOCAL_KEY, list);
  }

  function writeLocalPlans(plans) {
    var workspace = getWorkspace();
    if (!workspace) return;

    var summaries = [];
    (plans || []).forEach(function (plan) {
      if (!plan || !plan.id) return;
      workspace.writeJson(ITEM_PREFIX + plan.id, plan);
      summaries.push({
        id: plan.id,
        name: plan.name || 'Untitled Plan',
        updatedAt: plan.updatedAt || plan.savedAt || Date.now(),
        rooms: typeof plan.rooms === 'number' ? plan.rooms : countRooms(plan),
        area: typeof plan.area === 'number' ? plan.area : countArea(plan),
      });
    });

    workspace.writeJson(LIST_LOCAL_KEY, summaries);
  }

  function readLocalPlans() {
    var workspace = getWorkspace();
    if (!workspace) return [];

    return readLocalPlanList().map(function (summary) {
      var payload = workspace.readJson(ITEM_PREFIX + summary.id, null) || {};
      return Object.assign({}, payload, {
        id: summary.id,
        name: payload.name || summary.name || 'Untitled Plan',
        updatedAt: payload.updatedAt || summary.updatedAt || Date.now(),
        rooms: typeof summary.rooms === 'number' ? summary.rooms : countRooms(payload),
        area: typeof summary.area === 'number' ? summary.area : countArea(payload),
      });
    });
  }

  function countRooms(plan) {
    if (!plan) return 0;

    if (Array.isArray(plan.objects)) {
      return plan.objects.filter(function (item) { return item && item.type === 'room'; }).length;
    }

    if (Array.isArray(plan.rooms)) return plan.rooms.length;
    return 0;
  }

  function countArea(plan) {
    if (!plan) return 0;
    if (typeof plan.totalArea === 'number') return plan.totalArea;
    if (typeof plan.area === 'number') return plan.area;
    if (Array.isArray(plan.rooms)) {
      return plan.rooms.reduce(function (total, room) {
        return total + (room && room.area ? room.area : 0);
      }, 0);
    }
    return 0;
  }

  function planTimestamp(plan) {
    if (!plan) return 0;
    return getWorkspace().getTimestamp(plan.updatedAt || plan.savedAt);
  }

  function buildDraftRecord(payload) {
    var draft = payload || getLocalDraft();
    if (!draft) return null;

    return {
      itemType: DRAFT_TYPE,
      itemKey: 'current',
      toolSlug: TOOL_SLUG,
      title: draft.projectName || draft.name || 'Floor Plan Draft',
      summary: [
        countRooms(draft) ? countRooms(draft) + ' rooms' : '',
        countArea(draft) ? countArea(draft).toFixed(1) + ' m2' : '',
      ].filter(Boolean).join(' | '),
      href: '/engineering/floor-planner/',
      payload: Object.assign({}, clone(draft), {
        savedAt: draft.savedAt || Date.now(),
      }),
      meta: {
        units: draft.units || 'm',
      },
    };
  }

  function buildPlanRecord(plan) {
    return {
      itemType: ITEM_TYPE,
      itemKey: plan.id,
      toolSlug: TOOL_SLUG,
      title: plan.name || 'Untitled Plan',
      summary: [
        countRooms(plan) ? countRooms(plan) + ' rooms' : '',
        countArea(plan) ? countArea(plan).toFixed(1) + ' m2' : '',
      ].filter(Boolean).join(' | '),
      href: '/engineering/floor-planner/?project=' + encodeURIComponent(plan.id),
      payload: clone(plan),
      meta: {
        rooms: countRooms(plan),
        area: countArea(plan),
        units: plan.units || 'm',
      },
    };
  }

  function mirrorDraftAsProject(draft) {
    if (!draft || !draft.projectId) return;
    var plan = Object.assign({}, clone(draft), {
      id: draft.projectId,
      name: draft.projectName || draft.name || 'Untitled Plan',
      updatedAt: draft.savedAt || Date.now(),
      rooms: countRooms(draft),
      area: countArea(draft),
    });
    writeLocalPlan(plan);
  }

  async function bootstrapSync() {
    if (bootstrapCompleted) return;
    if (!getWorkspace() || !getWorkspace().isSignedIn()) return;
    if (!window.FPApp || typeof window.FPApp.loadProject !== 'function') return;

    var remoteItems = [];
    try {
      remoteItems = await getWorkspace().list({
        itemTypes: [DRAFT_TYPE, ITEM_TYPE],
        limit: 80,
      });
    } catch (error) {
      console.warn('[FPWorkspaceSync] Remote bootstrap failed:', error.message || error);
      return;
    }

    var remoteDraft = null;
    var remotePlans = [];
    remotePlanIndex = {};

    remoteItems.forEach(function (item) {
      if (item.item_type === DRAFT_TYPE) {
        remoteDraft = item.payload ? clone(item.payload) : null;
        return;
      }

      if (item.item_type === ITEM_TYPE && item.payload && item.item_key) {
        remotePlans.push(clone(item.payload));
        remotePlanIndex[item.item_key] = {
          fingerprint: JSON.stringify(item.payload),
        };
      }
    });

    var localPlans = readLocalPlans();
    if (!remotePlans.length && localPlans.length) {
      for (var localIndex = 0; localIndex < localPlans.length; localIndex += 1) {
        try {
          await getWorkspace().upsert(buildPlanRecord(localPlans[localIndex]));
          remotePlanIndex[localPlans[localIndex].id] = {
            fingerprint: JSON.stringify(localPlans[localIndex]),
          };
        } catch (error) {
          console.warn('[FPWorkspaceSync] Failed to upload local plan:', error.message || error);
        }
      }
      remotePlans = localPlans.slice();
    } else if (remotePlans.length) {
      writeLocalPlans(remotePlans);
    }

    var localDraft = getLocalDraft();
    if (remoteDraft && planTimestamp(remoteDraft) >= planTimestamp(localDraft)) {
      writeLocalDraft(remoteDraft);
      mirrorDraftAsProject(remoteDraft);
    } else if (!remoteDraft && localDraft) {
      try {
        await getWorkspace().upsert(buildDraftRecord(localDraft));
      } catch (error) {
        console.warn('[FPWorkspaceSync] Failed to upload local draft:', error.message || error);
      }
    }

    var params = new URLSearchParams(window.location.search);
    var requestedProjectId = params.get('project');
    if (requestedProjectId) {
      var requestedPlan = remotePlans.find(function (plan) { return plan.id === requestedProjectId; });
      if (requestedPlan) {
        writeLocalPlan(requestedPlan);
        window.FPApp.loadProject(requestedProjectId);
      }
    } else if (remoteDraft && remoteDraft.projectId) {
      window.FPApp.loadProject(remoteDraft.projectId);
    }

    lastDraftFingerprint = JSON.stringify(getLocalDraft() || {});
    lastPlansFingerprint = JSON.stringify(readLocalPlans().map(function (plan) {
      return [plan.id, plan.updatedAt || plan.savedAt || ''];
    }));
    bootstrapCompleted = true;
  }

  async function syncLoop() {
    if (!bootstrapCompleted || syncInFlight) return;
    if (!getWorkspace() || !getWorkspace().isSignedIn()) return;

    syncInFlight = true;
    try {
      var localDraft = getLocalDraft();
      var draftFingerprint = JSON.stringify(localDraft || {});
      if (localDraft && draftFingerprint !== lastDraftFingerprint) {
        await getWorkspace().upsert(buildDraftRecord(localDraft));
        lastDraftFingerprint = draftFingerprint;
      }

      var plans = readLocalPlans();
      var plansFingerprint = JSON.stringify(plans.map(function (plan) {
        return [plan.id, plan.updatedAt || plan.savedAt || ''];
      }));

      if (plansFingerprint !== lastPlansFingerprint) {
        var currentMap = {};

        for (var index = 0; index < plans.length; index += 1) {
          var plan = plans[index];
          currentMap[plan.id] = plan;
          var fingerprint = JSON.stringify(plan);
          if (!remotePlanIndex[plan.id] || remotePlanIndex[plan.id].fingerprint !== fingerprint) {
            await getWorkspace().upsert(buildPlanRecord(plan));
          }
        }

        var remoteIds = Object.keys(remotePlanIndex);
        for (var remoteIndex = 0; remoteIndex < remoteIds.length; remoteIndex += 1) {
          var remoteId = remoteIds[remoteIndex];
          if (!currentMap[remoteId]) {
            await getWorkspace().remove({ itemType: ITEM_TYPE, itemKey: remoteId });
          }
        }

        remotePlanIndex = {};
        plans.forEach(function (plan) {
          remotePlanIndex[plan.id] = {
            fingerprint: JSON.stringify(plan),
          };
        });

        lastPlansFingerprint = plansFingerprint;
      }
    } catch (error) {
      console.warn('[FPWorkspaceSync] Sync failed:', error.message || error);
    } finally {
      syncInFlight = false;
    }
  }

  function start() {
    if (!getWorkspace() || !window.FPApp) return;

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
